import Address, { AddressType, Schema } from "./model";
import { generateID } from "../../db";
import db from "../../db";
import { Knex } from "knex";

async function insertAddress(
  addresses: string[],
  applicationId: string,
  addressType: AddressType,
  txn: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  try {
    const addressObjArr = addresses.map((address) => ({
      id: generateID(),
      address,
      applicationId: applicationId,
      type: addressType,
    }));
    await Address.insert(addressObjArr, txn);
    return true;
  } catch (error) {
    return false;
  }
}

async function getAddressById(
  applicationId: string,
  type: AddressType
): Promise<Schema | null> {
  try {
    return (await Address.get({ applicationId, type }))[0];
  } catch (error) {
    return null;
  }
}

export default { insertAddress, getAddressById };
