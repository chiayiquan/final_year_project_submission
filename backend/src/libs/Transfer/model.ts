import * as JD from "decoders";
import db from "../../db";
import { Knex } from "knex";
import { ethers, BigNumberish } from "ethers";

export type TransferType = "FEES" | "TRANSFER";

const transferType: TransferType[] = ["FEES", "TRANSFER"];
export type Schema = Readonly<{
  id: string;
  transferType: TransferType;
  value: number;
  from: string;
  to: string;
  createdAt: number;
}>;

export type SmartContractTransaction = Readonly<{
  from: string;
  to: string;
  value: number;
  transferType: TransferType;
}>;

async function insert(
  data: Schema[],
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<{ id: string }[]> {
  return txns.insert(data).into("transfers").returning("id").then(decodeId);
}

async function getByUserIdWithPagination(
  userId: string,
  offset: number,
  limit: number
): Promise<Schema[]> {
  return db
    .select("*")
    .from("transfers")
    .where({ to: userId })
    .orWhere({ from: userId })
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .then(decode);
}

async function count(userId: string): Promise<number> {
  return db
    .count("*")
    .from("transfers")
    .where({ to: userId })
    .orWhere({ from: userId })
    .then(decodeNumber);
}

function decodeId(data: any): { id: string }[] {
  return JD.array(JD.object({ id: JD.string })).verify(data);
}

function decode(data: any): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      transferType: JD.oneOf(transferType),
      value: JD.number,
      from: JD.string,
      to: JD.string,
      createdAt: JD.number,
    })
  ).verify(data);
}

function decodeSmartContractTransaction(data: any): SmartContractTransaction[] {
  return JD.array(
    JD.tuple(
      JD.string,
      JD.string,
      JD.unknown,
      JD.oneOf<TransferType>(transferType)
    )
  )
    .verify(data)
    .map((element) => ({
      from: element[0],
      to: element[1],
      value: ethers.toNumber(element[2] as BigNumberish),
      transferType: element[3],
    }));
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export default {
  insert,
  getByUserIdWithPagination,
  decodeSmartContractTransaction,
  count,
};
