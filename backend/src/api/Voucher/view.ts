import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import env from "../../env";
import * as Voucher from "../../libs/Voucher";
import * as Transaction from "../../libs/Transaction";
import * as Contract from "../../libs/Contract";

const errors = {
  ...JWT.lib.errors,
  INSUFFICIENT_PERMISSION:
    "You do not have the permission to view this voucher.",
  INVALID_VOUCHER: "Voucher is invalid.",
  INVALID_CONTRACT: "Contract doesn't exist",
};

type ResponseData = {
  url: string;
  voucherDetail: Voucher.Schema & { contractAddress: string };
  transactions: Transaction.Schema[];
};

type Params = {
  id: string;
};

export default async function View(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { id } = decodeParams(request.params);

  const voucher = await Voucher.getVoucher({ id });

  if (voucher[0] == null)
    return StandardResponse.fail(response, errors, "INVALID_VOUCHER");

  if (voucher[0].owner !== jwtPayload.userId)
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const contract = await Contract.getContract(voucher[0].contractId);

  if (contract == null)
    return StandardResponse.fail(response, errors, "INVALID_CONTRACT");

  if (contract.address == null)
    return StandardResponse.fail(response, errors, "INVALID_CONTRACT");

  const transactions = await Transaction.getTransaction({ referenceId: id });

  const encryptedId = await Voucher.issue(id);

  return StandardResponse.success<ResponseData>(response, {
    voucherDetail: { ...voucher[0], contractAddress: contract.address },
    transactions,
    url: `${env.FRONT_END_URL}/voucher/redeem/${encryptedId}`,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    id: JD.string,
  }).verify(data);
}
