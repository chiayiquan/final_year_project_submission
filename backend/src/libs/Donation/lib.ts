import Donation, { DonationWithAddress } from "./model";
import { generateID } from "../../db";

async function insertDonation(data: {
  amount: number;
  userId: string;
  contractId: string;
  hash: string;
  metamaskAddress: string;
}): Promise<boolean> {
  try {
    await Donation.insert({ ...data, id: generateID(), createdAt: Date.now() });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getDonationByUserId(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<DonationWithAddress[]> {
  return Donation.getWithContractPagination({ userId }, page * limit, limit);
}

async function getTotalDonationByUserId(userId: string): Promise<number> {
  return Donation.count({ userId });
}

export default {
  insertDonation,
  getDonationByUserId,
  getTotalDonationByUserId,
};
