import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import * as Contract from "../../libs/Contract";
import Donation from "../../libs/Donation";

const errors = {
  ...JWT.lib.errors,
  INVALID_CONTRACT: "Contract does not exist.",
  INSERTION_ERROR: "Unable to add new entry, please try again later.",
};

type ResponseData = {
  message: string;
};

type Params = {
  amount: number;
  contractAddress: string;
  hash: string;
  metamaskAddress: string;
};

export default async function Insert(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { amount, contractAddress, hash, metamaskAddress } = decodeParams(
    request.body
  );

  const contract = await Contract.getContractByAddress(contractAddress);

  if (contract == null)
    return StandardResponse.fail(response, errors, "INVALID_CONTRACT");

  const isInserted = await Donation.lib.insertDonation({
    amount,
    userId: jwtPayload.userId,
    contractId: contract.id,
    hash,
    metamaskAddress,
  });

  if (isInserted === false)
    return StandardResponse.fail(response, errors, "INSERTION_ERROR");

  return StandardResponse.success<ResponseData>(response, {
    message: "Donation has been donated successfully.",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    amount: JD.number,
    contractAddress: JD.string,
    hash: JD.string,
    metamaskAddress: JD.string,
  }).verify(data);
}
