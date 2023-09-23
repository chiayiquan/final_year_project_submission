import * as User from "./model";
import Cryptos from "../Cryptos";
import Encryption from "../Encryption";
import { Knex } from "knex";
import db from "../../db";
import { Application, ApplicationSchema } from "../Application";
import { ContractSchema } from "../Contract";

async function createUser(
  data: { name: string; password: string; email: string },
  walletPassword: string
): Promise<string | null> {
  const walletAddress = Cryptos.Wallet.createNewWallet(walletPassword);
  if (walletAddress == null) return null;
  return User.insert({
    ...data,
    password: await Encryption.PasswordEncryption.hashPassword(data.password),
    id: walletAddress,
    role: "USER",
    createdAt: Date.now(),
    stripeUserId: null,
  });
}

async function checkUserExist(email: string): Promise<boolean> {
  return (await User.get({ email })).length > 0;
}

async function getUser(email: string): Promise<User.Schema> {
  return (await User.get({ email }))[0];
}

async function getUserById(id: string): Promise<User.Schema | null> {
  try {
    return (await User.get({ id }))[0];
  } catch (error) {
    return null;
  }
}

async function getUserIds(emails: string[]): Promise<string[]> {
  return User.getIdsByEmail(emails);
}

async function updateRole(
  id: string,
  role: User.Role,
  txn: Knex<any, unknown[]> | Knex.Transaction = db
): Promise<boolean> {
  try {
    await User.update({ role }, { id }, txn);
    return true;
  } catch (error) {
    return false;
  }
}

async function updateName(
  id: string,
  name: string,
  txn: Knex<any, unknown[]> | Knex.Transaction = db
): Promise<boolean> {
  try {
    await User.update({ name }, { id }, txn);
    return true;
  } catch (error) {
    return false;
  }
}

async function updateMultipleRoles(
  ids: string[],
  role: User.Role,
  txn: Knex<any, unknown[]> | Knex.Transaction = db
): Promise<boolean> {
  try {
    await User.updateRoles(role, ids, txn);
    return true;
  } catch (error) {
    return false;
  }
}

function getRoleWithApplicationType(
  application: Application,
  id: string = ""
): User.Role | null {
  switch (application.type) {
    case "BENEFICIARY":
      return "BENEFICIARY";
    case "MERCHANT":
      return "MERCHANT";
    case "ORGANIZATION":
      if (id.length === 0) return null;
      if (application.userId === id) return "ORGANIZATION_MANAGER";
      return "ORGANIZATION_MEMBER";
    default:
      return null;
  }
}

async function updateStripeId(
  id: string,
  stripeUserId: string,
  txn: Knex<any, unknown[]> | Knex.Transaction = db
): Promise<boolean> {
  try {
    await User.update({ stripeUserId }, { id }, txn);
    return true;
  } catch (error) {
    return false;
  }
}

function haveBeneficiaryPermission(
  user: User.Schema,
  application: ApplicationSchema,
  contract: ContractSchema
): boolean {
  return (
    user.role === "BENEFICIARY" &&
    application.status === "APPROVED" &&
    application.appliedCountry === contract.countryCode
  );
}

function haveMerchantPermission(
  user: User.Schema,
  application: ApplicationSchema,
  contract: ContractSchema
): boolean {
  return (
    user.role === "MERCHANT" &&
    application.status === "APPROVED" &&
    application.appliedCountry === contract.countryCode
  );
}

export default {
  createUser,
  checkUserExist,
  getUser,
  getUserById,
  getUserIds,
  updateRole,
  getRoleWithApplicationType,
  updateStripeId,
  haveBeneficiaryPermission,
  haveMerchantPermission,
  updateMultipleRoles,
  updateName,
};
