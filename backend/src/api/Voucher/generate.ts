import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import Cryptos from "../../libs/Cryptos";
import * as Voucher from "../../libs/Voucher";
import env from "../../env";
import * as Contract from "../../libs/Contract";
import db from "../../db";
import * as Transaction from "../../libs/Transaction";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import Application from "../../libs/Application";

const errors = {
  ...JWT.lib.errors,
  ...Cryptos.ContractError.errors,
  VOUCHER_GENERATION_ERROR: "Error in generating vouchers",
  INVALID_CONTRACT: "Contract does not exist",
  MAXIMUM_GENERATION: "Maximum number of voucher generated for the week.",
  UNKNOWN_ERROR: "Unable to insert into database",
  INVALID_USER: "User does not exist.",
  INSUFFICIENT_PERMISSION:
    "Insufficient permission to generate vouchers from this country",
  INVALID_APPLICATION: "Application does not exist.",
};

type ResponseData = {
  message: string;
};

export default async function Generate(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError)
    return StandardResponse.fail(response, errors, jwtPayload.name);

  const user = await User.lib.getUserById(jwtPayload.userId);
  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const application = await Application.lib.getApplicationByUserId(user.id);

  if (application == null)
    return StandardResponse.fail(response, errors, "INVALID_APPLICATION");

  const contractDetail = await Contract.getContractByCountryCode(
    application.appliedCountry
  );

  if (contractDetail == null || contractDetail.address == null)
    return StandardResponse.fail(response, errors, "INVALID_CONTRACT");

  if (
    User.lib.haveBeneficiaryPermission(user, application, contractDetail) ===
    false
  )
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PRIVILEGE");

  const userVouchers = await Voucher.getVoucher(
    { owner: user.id },
    {
      column: "createdAt",
      range: [Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now()],
    }
  );

  const wallet = Cryptos.Wallet.initWallet();

  const contract = Cryptos.Wallet.initContract(wallet, contractDetail.address);

  if (userVouchers.length >= env.NUMBER_OF_VOUCHER_PER_WEEK)
    return StandardResponse.fail(response, errors, "MAXIMUM_GENERATION");

  const remainingBalance =
    (await Cryptos.ContractFunction.getUsdcBalance(contract)) -
    (await Cryptos.ContractFunction.getUnusedVoucherAmount(contract));

  const generatedVoucherValue =
    (env.NUMBER_OF_VOUCHER_PER_WEEK - userVouchers.length) *
    (await Cryptos.ContractFunction.getVoucherPrice(contract));

  if (remainingBalance - generatedVoucherValue <= 0)
    return StandardResponse.fail(response, errors, "INSUFFICIENT_FUNDS");

  const voucherIds = [
    ...new Array(env.NUMBER_OF_VOUCHER_PER_WEEK - userVouchers.length).keys(),
  ].map((num) => Date.now() + num);

  try {
    await db.transaction(async (txns) => {
      const vouchers = await Voucher.insertVoucher(
        voucherIds.map(
          (voucherId) => ({
            owner: user.id,
            value: contractDetail.voucherPrice,
            voucherId,
            contractId: contractDetail.id,
          }),
          txns
        )
      );

      return Transaction.insertTransaction(
        vouchers.map(({ id }) => ({
          type: "GENERATE_VOUCHER",
          from: env.WALLET_ADDRESS,
          to: user.id,
          referenceId: id,
        })),
        txns
      );
    });
  } catch (error) {
    console.log(error);
    return StandardResponse.fail(response, errors, "UNKNOWN_ERROR");
  }

  return StandardResponse.success<ResponseData>(response, {
    message:
      "Transaction have been added to queue, transaction will be committed in a few minutes",
  });
}
