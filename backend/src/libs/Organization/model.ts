import db from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";
import Address, { AddressSchema } from "../Address";

export type OrganizationSchema = Readonly<{
  id: string;
  name: string;
  applicationId: string;
}>;

export type MemberSchema = Readonly<{
  id: string;
  userId: string;
  organizationId: string;
}>;

export type MemberData = Readonly<{
  id: string;
  userId: string;
  name: string;
  email: string;
}>;

export type Schema = OrganizationSchema & {
  members: MemberData[];
  addresses: AddressSchema[];
};

export type OrganizationOverview = OrganizationSchema & {
  addresses: AddressSchema[];
};

async function getById(id: string): Promise<Schema[]> {
  return db("organizations")
    .innerJoin(
      "organizationMembers",
      "organizations.id",
      "organizationMembers.organizationId"
    )
    .innerJoin(
      "addresses",
      "addresses.applicationId",
      "organizations.applicationId"
    )
    .innerJoin("users", "users.id", "organizationMembers.userId")
    .select([
      "organizations.*",
      db.raw(
        `JSONB_AGG(DISTINCT jsonb_build_object('id',"organizationMembers".id,'userId',"users".id, 'name',"users".name, 'email',"users".email)) as members`
      ),
      db.raw(`JSONB_AGG(DISTINCT "addresses".*) as addresses`),
    ])
    .where("organizations.id", id)
    .andWhere("addresses.type", "=", "BUSINESS")
    .groupBy("organizations.id")
    .then(decode);
}

async function getByUserId(userId: string): Promise<Schema[]> {
  return db("organizations")
    .innerJoin(
      "organizationMembers",
      "organizations.id",
      "organizationMembers.organizationId"
    )
    .innerJoin(
      "addresses",
      "addresses.applicationId",
      "organizations.applicationId"
    )
    .innerJoin("users", "users.id", "organizationMembers.userId")
    .select([
      "organizations.*",
      db.raw(
        `JSONB_AGG(DISTINCT jsonb_build_object('id',"organizationMembers".id,'userId',"users".id, 'name',"users".name, 'email',"users".email)) as members`
      ),
      db.raw(`JSONB_AGG(DISTINCT "addresses".*) as addresses`),
    ])
    .where(
      "organizationMembers.organizationId",
      db.select("organizationId").from("organizationMembers").where({ userId })
    )
    .andWhere("addresses.type", "=", "BUSINESS")
    .groupBy("organizations.id")
    .then(decode);
}

async function getByApplicationId(applicationId: string): Promise<Schema[]> {
  return db("organizations")
    .innerJoin(
      "organizationMembers",
      "organizations.id",
      "organizationMembers.organizationId"
    )
    .innerJoin(
      "addresses",
      "addresses.applicationId",
      "organizations.applicationId"
    )
    .innerJoin("users", "users.id", "organizationMembers.userId")
    .select([
      "organizations.*",
      db.raw(
        `JSONB_AGG(DISTINCT jsonb_build_object('id',"organizationMembers".id,'userId',"users".id, 'name',"users".name, 'email',"users".email)) as members`
      ),
      db.raw(`JSONB_AGG(DISTINCT "addresses".*) as addresses`),
    ])
    .where("organizations.applicationId", applicationId)
    .andWhere("addresses.type", "=", "BUSINESS")
    .groupBy("organizations.id")
    .then(decode);
}

async function getOrganizationByCountryCode(
  countryCode: string
): Promise<OrganizationOverview[]> {
  return db("organizations")
    .select([
      "organizations.*",
      db.raw(`JSONB_AGG(DISTINCT "addresses".*) as addresses`),
    ])
    .innerJoin("applications", "applications.id", "organizations.applicationId")
    .innerJoin(
      "addresses",
      "addresses.applicationId",
      "organizations.applicationId"
    )
    .where("applications.appliedCountry", countryCode)
    .andWhere("applications.status", "=", "APPROVED")
    .andWhere("addresses.type", "=", "BUSINESS")
    .groupBy("organizations.id")
    .then(decodeOrganizationOverview);
}

async function getOrganizationWithPagination(
  offset: number,
  limit: number
): Promise<OrganizationSchema[]> {
  return db
    .select(["id", "name", "applicationId"])
    .from("organizations")
    .offset(offset)
    .limit(limit)
    .then(decodeOrganization);
}

async function getOrganizationWithApplicationId(
  applicationId: string
): Promise<OrganizationSchema[]> {
  return db
    .select(["id", "name", "applicationId"])
    .from("organizations")
    .where({ applicationId })
    .then(decodeOrganization);
}

async function insertOrganization(
  data: OrganizationSchema,
  txn: Knex<any, unknown[]> | Knex.Transaction
): Promise<string> {
  return txn
    .insert(data)
    .into("organizations")
    .returning("id")
    .then((rows) => decodeReturningId(rows)[0].id);
}

async function insertOrganizationMember(
  data: MemberSchema[],
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  return txn.insert(data).into("organizationMembers").returning("*");
}

async function removeOrganizationMember(
  userIds: string[],
  organizationId: string,
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  return txn
    .delete()
    .from("organizationMembers")
    .whereIn("userId", userIds)
    .andWhere({ organizationId });
}

function decodeReturningId(data: any): { id: string }[] {
  return JD.array(JD.object({ id: JD.string })).verify(data);
}

async function count(): Promise<number> {
  return db.count("*").from("organizations").then(decodeNumber);
}

function decode(data: any): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      name: JD.string,
      applicationId: JD.string,
      members: JD.array(
        JD.object({
          id: JD.string,
          userId: JD.string,
          email: JD.string,
          name: JD.string,
        })
      ),
      addresses: JD.array(
        JD.object({
          id: JD.string,
          address: JD.string,
          applicationId: JD.string,
          type: JD.oneOf(Address.model.addressType),
        })
      ),
    })
  ).verify(data);
}

function decodeOrganization(data: any): OrganizationSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      name: JD.string,
      applicationId: JD.string,
    })
  ).verify(data);
}

function decodeOrganizationOverview(data: any): OrganizationOverview[] {
  return JD.array(
    JD.object({
      id: JD.string,
      name: JD.string,
      applicationId: JD.string,
      addresses: JD.array(
        JD.object({
          id: JD.string,
          address: JD.string,
          applicationId: JD.string,
          type: JD.oneOf(Address.model.addressType),
        })
      ),
    })
  ).verify(data);
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export default {
  getById,
  getByUserId,
  insertOrganization,
  insertOrganizationMember,
  getOrganizationWithPagination,
  count,
  removeOrganizationMember,
  getOrganizationWithApplicationId,
  getByApplicationId,
  getOrganizationByCountryCode,
};
