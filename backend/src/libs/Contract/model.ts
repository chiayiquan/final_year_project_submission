import db, { generateID } from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";

type Schema = Readonly<{
  id: string;
  countryCode: string;
  voucherPrice: number;
  fees: number;
  createdAt: number;
  address: string | null;
}>;

type ListSchema = Readonly<{
  countryCode: string;
  countryName: string;
  address: string | null;
}>;

async function get(whereClause: Partial<Schema>): Promise<Schema> {
  return db
    .select()
    .from("contracts")
    .where(whereClause)
    .then((rows) => decode(rows)[0]);
}

async function list(): Promise<ListSchema[]> {
  return db
    .select([
      "contracts.countryCode",
      "countries.name as countryName",
      "contracts.address",
    ])
    .from("contracts")
    .innerJoin("countries", "countries.code", "contracts.countryCode")
    .then(decodeList);
}

async function getByContractIds(contractIds: string[]): Promise<Schema[]> {
  return db.select().from("contracts").whereIn("id", contractIds).then(decode);
}

async function getAllContract(): Promise<Schema[]> {
  return db.select().from("contracts").then(decode);
}

async function insert(
  data: Partial<Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<{ id: string }[]> {
  return txns
    .insert({ ...data, id: generateID() })
    .into("contracts")
    .returning("id");
}

async function update(
  data: Partial<Schema>,
  whereClause: Partial<Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<Schema[]> {
  return txns
    .update(data)
    .from("contracts")
    .where(whereClause)
    .returning("*")
    .then(decode);
}

function decode(data: any[]): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      countryCode: JD.string,
      voucherPrice: JD.number,
      fees: JD.number,
      createdAt: JD.number,
      address: JD.nullable(JD.string),
    })
  ).verify(data);
}

function decodeList(data: any[]): ListSchema[] {
  return JD.array(
    JD.object({
      countryCode: JD.string,
      countryName: JD.string,
      address: JD.nullable(JD.string),
    })
  ).verify(data);
}

export {
  Schema,
  get,
  insert,
  getByContractIds,
  update,
  getAllContract,
  list,
  ListSchema,
};
