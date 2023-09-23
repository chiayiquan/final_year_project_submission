import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Stripe from "stripe";
import env from "../../env";
import StripeLib from "../../libs/Stripe";
import JWT, { JWTError } from "../../libs/JWT";

const errors = {
  ...JWT.lib.errors,
  ...StripeLib.errors,
  INVALID_DONATION:
    "Donation not found, please generate a new donation session.",
  DONATION_NOT_COMPLETED: "Donation amount are not paid, please try again.",
  INVALID_AMOUNT: "Donation amount is invalid, please try again.",
  UPDATE_ERROR: "Unable to update the entry, please try again.",
};

type ResponseData = {
  message: string;
};

type Params = {
  checkoutSession: string;
};

export default async function CheckoutSuccess(
  request: express.Request,
  response: express.Response
) {
  try {
    const jwtPayload = await JWT.lib.getJWTToken(request);

    if (jwtPayload instanceof JWTError) {
      return StandardResponse.fail(response, errors, jwtPayload.name);
    }

    const { checkoutSession } = decodeParams(request.body);

    const checkoutPayload = StripeLib.verifyToken(checkoutSession);

    if (checkoutPayload instanceof StripeLib.StripeCheckoutError) {
      return StandardResponse.fail(response, errors, checkoutPayload.name);
    }

    const stripeDonation = await StripeLib.getStripeDonationById(
      checkoutPayload.id
    );

    if (stripeDonation == null)
      return StandardResponse.fail(response, errors, "INVALID_DONATION");

    const stripe = new Stripe(env.STRIPE_KEY, { apiVersion: "2022-11-15" });

    const session = await stripe.checkout.sessions.retrieve(
      stripeDonation.stripeReferenceId
    );

    if (session.payment_status !== "paid")
      return StandardResponse.fail(response, errors, "DONATION_NOT_COMPLETED");

    if (session.amount_total == null)
      return StandardResponse.fail(response, errors, "INVALID_AMOUNT");
    const isUpdated = await StripeLib.updateStripeDonation(
      { amount: session.amount_total, status: "SUCCESS" },
      checkoutPayload.id
    );

    if (isUpdated === false)
      return StandardResponse.fail(response, errors, "UPDATE_ERROR");
    return StandardResponse.success<ResponseData>(response, {
      message: "Donation entry has been updated.",
    });
  } catch (error: any) {
    console.log(error);
    return StandardResponse.serverFail(request, response, error);
  }
}

function decodeParams(data: any): Params {
  return JD.object({
    checkoutSession: JD.string,
  }).verify(data);
}
