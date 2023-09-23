import * as Transaction from "./model";
import { Knex } from "knex";
import db, { generateID } from "../../db";

async function insertTransaction(
  data: {
    type: Transaction.Type;
    from: string;
    to: string;
    referenceId: string;
  }[],
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<{ id: string }[]> {
  return Transaction.insert(
    data.map((txnData) => ({
      ...txnData,
      status: "PENDING",
      createdAt: Date.now(),
      id: generateID(),
    })),
    txns
  );
}

async function getPendingTransaction(
  limit: number = 200
): Promise<Transaction.TransactionVoucherSchema[]> {
  return Transaction.getWithVoucher("PENDING", limit);
}

async function getPendingContract(): Promise<Transaction.Schema[]> {
  return Transaction.get({ status: "PENDING", type: "CONTRACT_DEPLOYMENT" });
}

async function getPendingUpdateFees(): Promise<Transaction.Schema[]> {
  return Transaction.get({ status: "PENDING", type: "UPDATE_FEES" });
}

async function getPendingUpdateVoucherPrice(): Promise<Transaction.Schema[]> {
  return Transaction.get({ status: "PENDING", type: "UPDATE_PRICE" });
}

async function updateStatus(
  status: Transaction.Status,
  hash: string | null,
  whereClause: Partial<Transaction.Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<Transaction.Schema[]> {
  return Transaction.update({ status, hash }, whereClause, txns);
}

async function updateBulkStatus(
  status: Transaction.Status,
  hash: string | null,
  whereIn: { column: keyof Partial<Transaction.Schema>; listOfData: string[] },
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<Transaction.Schema[]> {
  return Transaction.updateMultiple({ status, hash }, whereIn, txns);
}

async function getTransaction(
  whereClause: Partial<Transaction.Schema>
): Promise<Transaction.Schema[]> {
  return Transaction.get(whereClause);
}

async function getTransactionWithPagination(
  whereClause: Partial<Transaction.Schema>,
  page: number = 0,
  limit: number = 10
): Promise<Transaction.Schema[]> {
  return Transaction.getWithPagination(whereClause, page * limit, limit);
}

async function getTotalTransactions(
  whereClause: Partial<Transaction.Schema>,
  orWhere: Partial<Transaction.Schema> = {}
): Promise<number> {
  return Transaction.count(whereClause, orWhere);
}

async function getTransactionWithAddress(
  page: number = 0,
  limit: number = 10,
  where: Partial<Transaction.Schema> = {},
  orWhere: Partial<Transaction.Schema> = {}
): Promise<Transaction.TransactionWithContractAddress[]> {
  return Transaction.getWithContractAddress(
    page * limit,
    limit,
    where,
    orWhere
  );
}
export {
  insertTransaction,
  getPendingTransaction,
  updateStatus,
  getTransaction,
  getPendingContract,
  updateBulkStatus,
  getTransactionWithPagination,
  getTotalTransactions,
  getTransactionWithAddress,
  getPendingUpdateFees,
  getPendingUpdateVoucherPrice,
};
