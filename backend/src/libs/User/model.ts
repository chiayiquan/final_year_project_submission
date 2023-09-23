import db from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";

export type Role = Readonly<
  | "USER"
  | "ADMIN"
  | "MERCHANT"
  | "ORGANIZATION_MANAGER"
  | "ORGANIZATION_MEMBER"
  | "BENEFICIARY"
>;
const role: Role[] = [
  "USER",
  "ADMIN",
  "MERCHANT",
  "ORGANIZATION_MANAGER",
  "ORGANIZATION_MEMBER",
  "BENEFICIARY",
];

type Schema = Readonly<{
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: number;
  stripeUserId: string | null;
}>;

async function get(whereClause: Partial<Schema>): Promise<Schema[]> {
  return db.select("*").from("users").where(whereClause).then(decode);
}

async function getIdsByEmail(emails: string[]): Promise<string[]> {
  return db.select("id").from("users").whereIn("email", emails).then(decodeIds);
}

async function insert(data: Schema): Promise<string> {
  return db
    .insert(data)
    .into("users")
    .returning("id")
    .then((idArr) => idArr[0].id);
}

async function update(
  data: Partial<Schema>,
  whereClause: Partial<Schema>,
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  return txn.update(data).from("users").where(whereClause);
}

async function updateRoles(
  role: Role,
  userIds: string[],
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  return txn.update(role).from("users").whereIn("id", userIds);
}

function decode(data: any[]): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      name: JD.string,
      email: JD.string,
      password: JD.string,
      role: JD.oneOf(role),
      createdAt: JD.number,
      stripeUserId: JD.nullable(JD.string),
    })
  ).verify(data);
}

function decodeIds(data: any[]): string[] {
  const decodedData = JD.array(JD.object({ id: JD.string })).verify(data);
  return decodedData.map(({ id }) => id);
}

export { decode, insert, Schema, get, getIdsByEmail, update, updateRoles };
