import db from "../../db";
import * as JD from "decoders";
import { ContractErrorType, errorList } from "../Cryptos/contractError";
import { Knex } from "knex";
import * as Voucher from "../Voucher";

type Schema = Readonly<{
  id: string;
  type: Type;
  status: Status;
  from: string;
  to: string;
  referenceId: string;
  createdAt: number;
  hash: string | null;
}>;

type SwitchCase<T, Cases, K> = T extends keyof Cases ? Cases[T] : K;

type VoucherSchema = {
  [K in keyof Voucher.Schema as SwitchCase<
    K,
    {
      id: "voucherPK";
      status: "voucherStatus";
      createdAt: "voucherCreatedAt";
      // Add additional key mappings here
    },
    K
  >]: Voucher.Schema[K];
};

type TransactionVoucherSchema = VoucherSchema & Schema;

type TransactionWithContractAddress = Schema & { address: string | null };

type Type = Readonly<
  | "CONTRACT_DEPLOYMENT"
  | "TRANSFER"
  | "REDEEM_VOUCHER"
  | "GENERATE_VOUCHER"
  | "UPDATE_FEES"
  | "UPDATE_PRICE"
>;
const typeList: Type[] = [
  "CONTRACT_DEPLOYMENT",
  "TRANSFER",
  "REDEEM_VOUCHER",
  "GENERATE_VOUCHER",
  "UPDATE_FEES",
  "UPDATE_PRICE",
];

type Status = Readonly<"SUCCESS" | "PENDING" | ContractErrorType>;

const statusList: Status[] = [...errorList, "SUCCESS", "PENDING"];

async function get(whereClause: Partial<Schema>): Promise<Schema[]> {
  return db.select().from("transactions").where(whereClause).then(decode);
}

async function getWithContractAddress(
  offset: number,
  limit: number,
  whereClause: Partial<Schema>,
  orWhereClause: Partial<Schema>
): Promise<TransactionWithContractAddress[]> {
  return db("transactions")
    .select(
      "transactions.*",
      db.raw(
        "COALESCE(contracts.address, contracts_vouchers.address) AS address"
      )
    )
    .leftJoin("contracts", function () {
      this.on("transactions.referenceId", "=", "contracts.id").andOn(
        db.raw(
          "transactions.type IN ('CONTRACT_DEPLOYMENT','UPDATE_FEES','UPDATE_PRICE')"
        )
      );
    })
    .leftJoin("vouchers", function () {
      this.on("transactions.referenceId", "=", "vouchers.id").andOn(
        db.raw("transactions.type IN ('GENERATE_VOUCHER', 'REDEEM_VOUCHER')")
      );
    })
    .leftJoin(
      "contracts as contracts_vouchers",
      "vouchers.contractId",
      "=",
      "contracts_vouchers.id"
    )
    .where(whereClause)
    .orWhere(orWhereClause)
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .then(decodeTransactionWithContractAddress);
}

async function getWithPagination(
  whereClause: Partial<Schema>,
  offset: number,
  limit: number
): Promise<Schema[]> {
  return db
    .select()
    .from("transactions")
    .where(whereClause)
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .then((rows) => decode(rows));
}

async function getWithVoucher(
  status: Status,
  limit: number
): Promise<TransactionVoucherSchema[]> {
  return db
    .select(
      "vouchers.id as voucherPK",
      "vouchers.status as voucherStatus",
      "vouchers.createdAt as voucherCreatedAt",
      "vouchers.*",
      "transactions.*"
    )
    .from("transactions")
    .leftJoin("vouchers", "transactions.referenceId", "vouchers.id")
    .where("transactions.status", status)
    .andWhereNot("transactions.type", "CONTRACT_DEPLOYMENT")
    .andWhereNot("transactions.type", "UPDATE_FEES")
    .andWhereNot("transactions.type", "UPDATE_PRICE")
    .limit(limit)
    .then(decodeTransactionVoucherSchema);
}

async function insert(
  data: Partial<Schema>[],
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<{ id: string }[]> {
  return txns.insert(data).into("transactions").returning("id");
}

async function update(
  data: Partial<Schema>,
  whereClause: Partial<Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<Schema[]> {
  return txns
    .update(data)
    .from("transactions")
    .where(whereClause)
    .returning("*")
    .then(decode);
}

async function updateMultiple(
  data: Partial<Schema>,
  whereIn: { column: keyof Partial<Schema>; listOfData: string[] },
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<Schema[]> {
  return txns
    .update(data)
    .from("transactions")
    .whereIn(whereIn.column, whereIn.listOfData)
    .returning("*")
    .then(decode);
}

async function count(
  whereClause: Partial<Schema>,
  orWhere: Partial<Schema>
): Promise<number> {
  return db
    .count("*")
    .from("transactions")
    .where(whereClause)
    .orWhere(orWhere)
    .then(decodeNumber);
}

function decode(data: any[]): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      type: JD.oneOf(typeList),
      status: JD.oneOf(statusList),
      from: JD.string,
      to: JD.string,
      referenceId: JD.string,
      createdAt: JD.number,
      hash: JD.nullable(JD.string),
    })
  ).verify(data);
}

function decodeTransactionWithContractAddress(
  data: any[]
): TransactionWithContractAddress[] {
  return JD.array(
    JD.object({
      id: JD.string,
      type: JD.oneOf(typeList),
      status: JD.oneOf(statusList),
      from: JD.string,
      to: JD.string,
      referenceId: JD.string,
      createdAt: JD.number,
      hash: JD.nullable(JD.string),
      address: JD.nullable(JD.string),
    })
  ).verify(data);
}

function decodeTransactionVoucherSchema(
  data: any[]
): TransactionVoucherSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      type: JD.oneOf(typeList),
      status: JD.oneOf(statusList),
      from: JD.string,
      to: JD.string,
      referenceId: JD.string,
      createdAt: JD.number,
      hash: JD.nullable(JD.string),
      voucherPK: JD.string,
      voucherStatus: JD.oneOf(Voucher.status),
      owner: JD.string,
      value: JD.number,
      voucherId: JD.number,
      contractId: JD.string,
      voucherCreatedAt: JD.number,
    })
  ).verify(data);
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export {
  Schema,
  get,
  insert,
  Type,
  Status,
  update,
  getWithVoucher,
  TransactionVoucherSchema,
  updateMultiple,
  getWithPagination,
  count,
  getWithContractAddress,
  TransactionWithContractAddress,
};
