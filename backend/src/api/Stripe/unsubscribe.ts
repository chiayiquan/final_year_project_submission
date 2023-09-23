import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Stripe from "stripe";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import env from "../../env";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
  NO_SUBSCRIPTION: "No subscription found.",
};

type ResponseData = {
  message: string;
};

type Params = {
  subscriptionId: string;
};

export default async function ListPrices(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const user = await User.lib.getUserById(jwtPayload.userId);

  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  if (user.stripeUserId == null)
    return StandardResponse.fail(response, errors, "NO_SUBSCRIPTION");

  const { subscriptionId } = decodeParams(request.body);

  const stripe = new Stripe(env.STRIPE_KEY, { apiVersion: "2022-11-15" });

  const listSubscriptions = await stripe.subscriptions.list({
    customer: user.stripeUserId,
  });

  const haveSub = listSubscriptions.data.some(
    (sub) => sub.id === subscriptionId && sub.status === "active"
  );

  if (haveSub === false)
    return StandardResponse.success<ResponseData>(response, {
      message: "Subscription has been cancelled",
    });

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return StandardResponse.success<ResponseData>(response, {
    message: "Subscription has been cancelled",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    subscriptionId: JD.string,
  }).verify(data);
}
