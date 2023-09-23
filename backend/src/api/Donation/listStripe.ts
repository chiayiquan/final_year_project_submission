import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import StripeLib, { StripeDonationWithProductName } from "../../libs/Stripe";

const errors = {
  ...JWT.lib.errors,
};

type ResponseData = {
  stripeDonation: StripeDonationWithProductName[];
  totalStripeDonation: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function ListStripe(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { page, limit } = decodeParams(request.query);

  const [stripeDonation, totalStripeDonation] = await Promise.all([
    StripeLib.getStripeDonationByUserId(jwtPayload.userId, page, limit),
    StripeLib.getTotalStripeDonationByUserId(jwtPayload.userId),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    stripeDonation,
    totalStripeDonation,
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
