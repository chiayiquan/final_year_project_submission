import Transfer, { Schema, TransferType } from "./model";
import db, { generateID } from "../../db";
import { Knex } from "knex";

async function getTransferWithPagination(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<Schema[]> {
  return Transfer.getByUserIdWithPagination(userId, page * limit, limit);
}

async function insertTransfer(
  data: {
    transferType: TransferType;
    from: string;
    to: string;
    value: number;
  }[],
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<{ id: string }[]> {
  return Transfer.insert(
    data.map((txnData) => ({
      ...txnData,
      createdAt: Date.now(),
      id: generateID(),
    })),
    txns
  );
}

async function getTotalTransfer(userId: string): Promise<number> {
  return Transfer.count(userId);
}

export default { getTransferWithPagination, insertTransfer, getTotalTransfer };
