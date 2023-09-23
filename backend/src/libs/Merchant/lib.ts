import Merchant, { MerchantData } from "./model";
import { generateID } from "../../db";
import db from "../../db";
import { Knex } from "knex";
import Address from "../Address";

async function insertMerchant(
  merchantData: {
    name: string;
    applicationId: string;
  },
  addresses: string[],
  txn: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<string | null> {
  try {
    const merchantId = await Merchant.insert(
      {
        ...merchantData,
        id: generateID(),
      },
      txn
    );
    await Address.lib.insertAddress(
      addresses,
      merchantData.applicationId,
      "BUSINESS",
      txn
    );

    return merchantId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getByApplicationId(
  applicationId: string
): Promise<MerchantData | null> {
  try {
    const merchant = await Merchant.get({ applicationId });
    return merchant[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getByCountryCode(countryCode: string): Promise<MerchantData[]> {
  return Merchant.getMerchantByCountryCode(countryCode);
}

export default { insertMerchant, getByApplicationId, getByCountryCode };
