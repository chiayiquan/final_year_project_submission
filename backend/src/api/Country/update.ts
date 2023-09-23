import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import * as Contract from "../../libs/Contract";
import * as Transaction from "../../libs/Transaction";
import db from "../../db";
import Cryptos from "../../libs/Cryptos";

const errors = {
  ...JWT.lib.errors,
  ...Cryptos.ContractError.errors,
  INSUFFICIENT_PERMISSION: "You do not have the permission to update record.",
  CONTRACT_NOT_FOUND: "The country you provided is not supported currently",
};

type ResponseData = {
  message: string;
};

type Params = {
  countryCode: string;
  fees: number;
  voucherPrice: number;
};

export default async function Update(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const user = await User.lib.getUserById(jwtPayload.userId);

  if (user == null || user.role != "ADMIN")
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const { countryCode, fees, voucherPrice } = decodeParams(request.body);

  if (fees < 0)
    return StandardResponse.fail(response, errors, "FEES_BELOW_ZERO");

  if (fees > 100)
    return StandardResponse.fail(response, errors, "FEES_ABOVE_HUNDRED");

  if (voucherPrice < 0.000001)
    return StandardResponse.fail(response, errors, "INVALID_VOUCHER_PRICE");

  const contract = await Contract.getContractByCountryCode(countryCode);

  if (contract == null || contract.address == null)
    return StandardResponse.fail(response, errors, "CONTRACT_NOT_FOUND");

  const address = contract.address;
  if (fees !== contract.fees) {
    await db.transaction((txn) => {
      return Promise.all([
        Transaction.insertTransaction(
          [
            {
              type: "UPDATE_FEES",
              from: user.id,
              to: address,
              referenceId: contract.id,
            },
          ],
          txn
        ),
        Contract.updateFees(fees, contract.id, txn),
      ]);
    });
  }

  if (voucherPrice !== contract.voucherPrice) {
    await db.transaction((txn) => {
      return Promise.all([
        Transaction.insertTransaction(
          [
            {
              type: "UPDATE_PRICE",
              from: user.id,
              to: address,
              referenceId: contract.id,
            },
          ],
          txn
        ),
        Contract.updateVoucherPrice(voucherPrice, contract.id, txn),
      ]);
    });
  }

  return StandardResponse.success<ResponseData>(response, {
    message:
      "Contract has been added to queue, update will be committed in a few minutes",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    countryCode: JD.string.transform((str) => str.toUpperCase()),
    fees: JD.number,
    voucherPrice: JD.number,
  }).verify(data);
}
