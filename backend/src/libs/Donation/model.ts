import db from "../../db";
import * as JD from "decoders";

export type MetamaskDonationsSchema = Readonly<{
  id: string;
  amount: number;
  userId: string;
  contractId: string;
  hash: string;
  metamaskAddress: string;
  createdAt: number;
}>;

export type DonationWithAddress = Readonly<
  MetamaskDonationsSchema & { address: string }
>;

async function insert(
  data: MetamaskDonationsSchema
): Promise<{ id: string }[]> {
  return db.insert(data).from("metamaskDonations").returning("*");
}

async function get(
  whereClause: Partial<MetamaskDonationsSchema>
): Promise<MetamaskDonationsSchema[]> {
  return db
    .select("*")
    .from("metamaskDonations")
    .where(whereClause)
    .then(decode);
}

async function getWithContractPagination(
  whereClause: Partial<MetamaskDonationsSchema>,
  offset: number,
  limit: number
): Promise<DonationWithAddress[]> {
  return db
    .select(["metamaskDonations.*", "contracts.address"])
    .from("metamaskDonations")
    .innerJoin("contracts", "contracts.id", "metamaskDonations.contractId")
    .where(whereClause)
    .offset(offset)
    .limit(limit)
    .then(decodeWithAddress);
}

async function count(
  whereClause: Partial<MetamaskDonationsSchema>
): Promise<number> {
  return db
    .count("*")
    .from("metamaskDonations")
    .andWhere(whereClause)
    .then(decodeNumber);
}

function decode(data: any): MetamaskDonationsSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      amount: JD.number,
      userId: JD.string,
      contractId: JD.string,
      hash: JD.string,
      metamaskAddress: JD.string,
      createdAt: JD.number,
    })
  ).verify(data);
}

function decodeWithAddress(data: any): DonationWithAddress[] {
  return JD.array(
    JD.object({
      id: JD.string,
      amount: JD.number,
      userId: JD.string,
      contractId: JD.string,
      hash: JD.string,
      metamaskAddress: JD.string,
      createdAt: JD.number,
      address: JD.string,
    })
  ).verify(data);
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export default { insert, get, getWithContractPagination, count };
