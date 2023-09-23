import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Cryptos from "../../libs/Cryptos";
import * as Transaction from "../../libs/Transaction";
import * as Voucher from "../../libs/Voucher";
import * as Contract from "../../libs/Contract";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import Application from "../../libs/Application";

const errors = {
  ...JWT.lib.errors,
  ...Voucher.errors,
  VOUCHER_RETRIEVAL_ERROR: "Error in retrieving voucher detail",
  TRANSACTION_EXISTED:
    "The voucher you are redeeming is redeemed or pending for redemption.",
  INVALID_USER: "User does not exist.",
  INSUFFICIENT_PERMISSION:
    "Insufficient permission to generate vouchers from this country",
  INVALID_APPLICATION: "Application does not exist.",
  UNKNOWN_ERROR: "Unable to insert into database",
  VOUCHER_USED: "Voucher has already been used.",
  INVALID_VOUCHER: "Voucher is invalid.",
};

type ResponseData = {
  message: string;
};

type Params = {
  id: string;
};

export default async function Redeem(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError)
    return StandardResponse.fail(response, errors, jwtPayload.name);

  const merchant = await User.lib.getUserById(jwtPayload.userId);

  if (merchant == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  if (merchant.role !== "MERCHANT")
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const { id } = decodeParams(request.body);

  const voucher = await Voucher.verifyToken(id);

  if (voucher instanceof Voucher.VoucherError)
    return StandardResponse.fail(response, errors, voucher.name);

  const contractDetail = await Contract.getContract(voucher.contractId);

  if (contractDetail == null || contractDetail.address == null)
    return StandardResponse.fail(response, errors, "VOUCHER_RETRIEVAL_ERROR");

  const merchantApplication = await Application.lib.getApplicationByUserId(
    merchant.id
  );

  if (merchantApplication == null)
    return StandardResponse.fail(response, errors, "INVALID_APPLICATION");

  if (
    User.lib.haveMerchantPermission(
      merchant,
      merchantApplication,
      contractDetail
    ) === false
  )
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const wallet = Cryptos.Wallet.initWallet();

  const contract = Cryptos.Wallet.initContract(wallet, contractDetail.address);

  const voucherDetail = await Cryptos.ContractFunction.getMealVoucherDetail(
    contract,
    voucher.owner,
    voucher.voucherId
  );

  if (voucherDetail instanceof Error)
    return StandardResponse.fail(response, errors, "VOUCHER_RETRIEVAL_ERROR");

  if (voucherDetail.value === 0 && voucherDetail.voucherStatus === "INVALID")
    return StandardResponse.fail(response, errors, "INVALID_VOUCHER");

  if (voucherDetail.voucherStatus === "USED")
    return StandardResponse.fail(response, errors, "VOUCHER_USED");

  const isExistingTransaction = await Transaction.getTransaction({
    referenceId: voucher.id,
    type: "REDEEM_VOUCHER",
  });

  if (isExistingTransaction.length > 0)
    return StandardResponse.fail(response, errors, "TRANSACTION_EXISTED");

  const transaction = await Transaction.insertTransaction([
    {
      type: "REDEEM_VOUCHER",
      from: voucher.owner,
      to: merchant.id,
      referenceId: voucher.id,
    },
  ]);

  if (transaction.length === 0)
    return StandardResponse.fail(response, errors, "UNKNOWN_ERROR");
  return StandardResponse.success<ResponseData>(response, {
    message:
      "Transaction have been added to queue, transaction will be committed in a few minutes",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    id: JD.string,
  }).verify(data);
}
