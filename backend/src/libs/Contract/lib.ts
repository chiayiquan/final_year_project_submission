import * as Contract from "./model";
import { Knex } from "knex";
import db from "../../db";

async function createContract(
  data: {
    countryCode: string;
    voucherPrice: number;
    fees: number;
  },
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<{ id: string }[]> {
  return Contract.insert(
    {
      ...data,
      createdAt: Date.now(),
    },
    txns
  );
}

async function getMultipleContracts(
  contractIds: string[]
): Promise<{ [key: string]: Contract.Schema }> {
  const contracts = await Contract.getByContractIds(contractIds);
  let contractDict: { [key: string]: Contract.Schema } = {};
  contracts.forEach((contract) => {
    contractDict[contract.id] = contract;
  });

  return contractDict;
}

async function getContract(id: string): Promise<Contract.Schema | null> {
  try {
    return Contract.get({ id });
  } catch (error) {
    return null;
  }
}

async function getContractByCountryCode(
  countryCode: string
): Promise<Contract.Schema | null> {
  try {
    return Contract.get({ countryCode });
  } catch (error) {
    return null;
  }
}

async function getContractByAddress(
  address: string
): Promise<Contract.Schema | null> {
  try {
    return Contract.get({ address });
  } catch (error) {
    return null;
  }
}

async function getAllContract(): Promise<Contract.Schema[]> {
  return Contract.getAllContract();
}

async function checkContractExisted(countryCode: string): Promise<Boolean> {
  return (await Contract.get({ countryCode })) != null;
}

async function updateContractAddress(
  data: Partial<Contract.Schema>,
  whereClause: Partial<Contract.Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<Contract.Schema[]> {
  return Contract.update(data, whereClause, txns);
}

async function getSupportedCountries(): Promise<Contract.ListSchema[]> {
  return Contract.list();
}

async function updateFees(
  fees: number,
  id: string,
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  try {
    await Contract.update({ fees }, { id }, txns);
    return true;
  } catch (error) {
    return false;
  }
}

async function updateVoucherPrice(
  voucherPrice: number,
  id: string,
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  try {
    await Contract.update({ voucherPrice }, { id }, txns);
    return true;
  } catch (error) {
    return false;
  }
}

export {
  createContract,
  getMultipleContracts,
  checkContractExisted,
  updateContractAddress,
  getContract,
  getAllContract,
  getContractByCountryCode,
  getSupportedCountries,
  getContractByAddress,
  updateFees,
  updateVoucherPrice,
};
