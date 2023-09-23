import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import Donation, { DonationWithAddress } from "../../libs/Donation";

const errors = {
  ...JWT.lib.errors,
};

type ResponseData = {
  metamaskDonation: DonationWithAddress[];
  totalMetamaskDonation: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function ListMetamask(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { page, limit } = decodeParams(request.query);

  const [metamaskDonation, totalMetamaskDonation] = await Promise.all([
    Donation.lib.getDonationByUserId(jwtPayload.userId, page, limit),
    Donation.lib.getTotalDonationByUserId(jwtPayload.userId),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    metamaskDonation,
    totalMetamaskDonation,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    page: JD.optional(JD.string).transform(
      (strNum) => Number(strNum) || undefined
    ),
    limit: JD.optional(JD.string).transform(
      (strNum) => Number(strNum) || undefined
    ),
  }).verify(data);
}
