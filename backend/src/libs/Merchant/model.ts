import db from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";
import Address, { AddressSchema } from "../Address";

export type Schema = {
  id: string;
  name: string;
  applicationId: string;
};

export type MerchantData = Readonly<Schema & { addresses: AddressSchema[] }>;

async function get(whereClause: Partial<Schema>): Promise<MerchantData[]> {
  const formattedWhereClause = Object.keys(whereClause).reduce(
    (accumulator, currentValue) => {
      accumulator[`merchants.${currentValue}` as keyof typeof accumulator] =
        whereClause[currentValue as keyof Schema];
      return accumulator;
    },
    {} as Partial<Schema>
  );
  return db("merchants")
    .select([
      "merchants.*",
      db.raw(`JSONB_AGG(DISTINCT "addresses".*) as addresses`),
    ])
    .innerJoin(
      "addresses",
      "addresses.applicationId",
      "merchants.applicationId"
    )
    .where(formattedWhereClause)
    .andWhere("addresses.type", "=", "BUSINESS")
    .groupBy("merchants.id")
    .then(decode);
}

async function getMerchantByCountryCode(
  countryCode: string
): Promise<MerchantData[]> {
  return db("merchants")
    .select([
      "merchants.*",
      db.raw(`JSONB_AGG(DISTINCT "addresses".*) as addresses`),
    ])
    .innerJoin("applications", "applications.id", "merchants.applicationId")
    .innerJoin(
      "addresses",
      "addresses.applicationId",
      "merchants.applicationId"
    )
    .where("applications.appliedCountry", countryCode)
    .andWhere("applications.status", "APPROVED")
    .andWhere("addresses.type", "=", "BUSINESS")
    .groupBy("merchants.id")
    .then(decode);
}

async function insert(
  data: Schema,
  txn: Knex<any, unknown[]> | Knex.Transaction
): Promise<string> {
  return txn
    .insert(data)
    .into("merchants")
    .returning("id")
    .then((rows) => decodeReturningId(rows)[0].id);
}

function decodeReturningId(data: any): { id: string }[] {
  return JD.array(JD.object({ id: JD.string })).verify(data);
}

function decode(data: any): MerchantData[] {
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

export default { get, insert, getMerchantByCountryCode };
