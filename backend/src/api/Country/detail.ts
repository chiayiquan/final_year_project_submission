import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as Contract from "../../libs/Contract";
import * as JD from "decoders";
import Cryptos from "../../libs/Cryptos";
import Organization, { OrganizationOverview } from "../../libs/Organization";
import Merchant, { MerchantData } from "../../libs/Merchant";

const errors = {
  UNSUPPORTED_COUNTRY: "The queried country is not supported currently.",
};

type ResponseData = {
  detail: {
    totalVoucherIssued: number;
    totalVoucherUsed: number;
    unusedVoucherAmount: number;
    mealVoucherPrice: number;
    usdcBalance: number;
    managementFees: number;
    organizations: OrganizationOverview[];
    merchants: MerchantData[];
    contractId: string;
  };
};

type Params = {
  countryCode: string;
};

export default async function Detail(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const { countryCode } = decodeParam(request.params);

  const contract = await Contract.getContractByCountryCode(countryCode);

  if (contract == null || contract.address == null)
    return StandardResponse.fail(response, errors, "UNSUPPORTED_COUNTRY");

  const wallet = Cryptos.Wallet.initWallet();

  const smartContract = Cryptos.Wallet.initContract(wallet, contract.address);

  const [
    totalVoucherIssued,
    totalVoucherUsed,
    unusedVoucherAmount,
    mealVoucherPrice,
    usdcBalance,
    managementFees,
    organizations,
    merchants,
  ] = await Promise.all([
    Cryptos.ContractFunction.getTotalVoucherIssued(smartContract),
    Cryptos.ContractFunction.getTotalVoucherUsed(smartContract),
    Cryptos.ContractFunction.getUnusedVoucherAmount(smartContract),
    Cryptos.ContractFunction.getVoucherPrice(smartContract),
    Cryptos.ContractFunction.getUsdcBalance(smartContract),
    Cryptos.ContractFunction.getCurrentManagementFees(smartContract),
    Organization.lib.getOrganizationByCountryCode(countryCode),
    Merchant.lib.getByCountryCode(countryCode),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    detail: {
      totalVoucherIssued,
      totalVoucherUsed,
      unusedVoucherAmount,
      mealVoucherPrice,
      usdcBalance,
      managementFees,
      organizations,
      merchants,
      contractId: contract.address,
    },
  });
}

function decodeParam(data: any): Params {
  return JD.object({
    countryCode: JD.string.transform((str) => str.toUpperCase()),
  }).verify(data);
}
