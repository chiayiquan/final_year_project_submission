import Organization, {
  Schema,
  OrganizationSchema,
  OrganizationOverview,
} from "./model";
import { generateID } from "../../db";
import db from "../../db";
import { Knex } from "knex";
import User from "../User";
import Address from "../Address";

async function insertOrganization(
  organizationData: {
    name: string;
    applicationId: string;
  },
  addresses: string[],
  members: string[],
  txn: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<string | null> {
  try {
    const organizationId = await Organization.insertOrganization(
      {
        ...organizationData,
        id: generateID(),
      },
      txn
    );

    await Address.lib.insertAddress(
      addresses,
      organizationData.applicationId,
      "BUSINESS",
      txn
    );

    const membersData = members.map((userId) => ({
      id: generateID(),
      userId,
      organizationId,
    }));
    await Organization.insertOrganizationMember(membersData, txn);
    return organizationId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getByUserId(userId: string): Promise<Schema | null> {
  try {
    return (await Organization.getByUserId(userId))[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getById(id: string): Promise<Schema | null> {
  try {
    return (await Organization.getById(id))[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getOrganizationWithApplicationId(
  applicationId: string
): Promise<Schema | null> {
  try {
    const organization = await Organization.getByApplicationId(applicationId);
    return organization[0];
  } catch (error) {
    return null;
  }
}

async function getOrganizationWithPagination(
  page: number = 0,
  limit: number = 10
): Promise<OrganizationSchema[]> {
  return Organization.getOrganizationWithPagination(page * limit, limit);
}

async function getOrganizationByCountryCode(
  countryCode: string
): Promise<OrganizationOverview[]> {
  return Organization.getOrganizationByCountryCode(countryCode);
}

async function getTotalOrganizations(): Promise<number> {
  return Organization.count();
}

async function addNewMember(
  userIds: string[],
  organizationId: string,
  txn: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  try {
    await db.transaction(async (txn) => {
      const membersData = userIds.map((userId) => ({
        id: generateID(),
        userId,
        organizationId,
      }));
      await Promise.all([
        Organization.insertOrganizationMember(membersData, txn),
        User.lib.updateMultipleRoles(userIds, "ORGANIZATION_MEMBER", txn),
      ]);
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function removeMember(
  userIds: string[],
  organizationId: string
): Promise<boolean> {
  try {
    await db.transaction(async (txn) => {
      await Promise.all([
        Organization.removeOrganizationMember(userIds, organizationId, txn),
        User.lib.updateMultipleRoles(userIds, "USER", txn),
      ]);
    });
    return true;
  } catch (error) {
    return false;
  }
}

export default {
  insertOrganization,
  getByUserId,
  getById,
  getOrganizationWithPagination,
  getTotalOrganizations,
  addNewMember,
  removeMember,
  getOrganizationWithApplicationId,
  getOrganizationByCountryCode,
};
