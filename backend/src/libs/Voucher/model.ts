import db, { generateID } from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";

type Status = Readonly<"VALID" | "INVALID" | "USED">;

const status: Status[] = ["VALID", "INVALID", "USED"];

type Schema = Readonly<{
  id: string;
  status: Status;
  owner: string;
  value: number;
  voucherId: number;
  contractId: string;
  createdAt: number;
}>;

async function get(
  whereClause: Partial<Schema>,
  whereBetween: {
    column: keyof Partial<Schema>;
    range: [number, number];
  } | null = null
): Promise<Schema[]> {
  let query = db.select().from("vouchers").where(whereClause);
  return whereBetween != null
    ? query
        .whereBetween(whereBetween.column, whereBetween.range)
        .then((rows) => decode(rows))
    : query.then((rows) => decode(rows));
}

async function getWithPagination(
  whereClause: Partial<Schema>,
  offset: number,
  limit: number
): Promise<Schema[]> {
  return db
    .select()
    .from("vouchers")
    .where(whereClause)
    .orderByRaw(`CASE WHEN status = 'VALID' THEN 0 ELSE 1 END`)
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .then((rows) => decode(rows));
}

async function getByIds(whereClause: Partial<string>[]): Promise<Schema[]> {
  return db
    .select()
    .from("vouchers")
    .whereIn("id", whereClause)
    .then((rows) => decode(rows));
}

async function insert(
  data: Partial<Schema>[],
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<Schema[]> {
  return txns.insert(data).into("vouchers").returning("*").then(decode);
}

async function update(
  data: Partial<Schema>,
  whereClause: Partial<Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<Schema[]> {
  return txns
    .update(data)
    .from("vouchers")
    .where(whereClause)
    .returning("*")
    .then(decode);
}

async function count(userId: string): Promise<number> {
  return db
    .count("*")
    .from("vouchers")
    .where({ owner: userId })
    .then(decodeNumber);
}

function decode(data: any[]): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      status: JD.oneOf(status),
      owner: JD.string,
      value: JD.number,
      voucherId: JD.number,
      contractId: JD.string,
      createdAt: JD.number,
    })
  ).verify(data);
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export {
  Schema,
  Status,
  get,
  insert,
  getByIds,
  update,
  status,
  getWithPagination,
  count,
};
