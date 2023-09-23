import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import StripeLib from "../../libs/Stripe";
import Stripe from "stripe";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import env from "../../env";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  subscriptions: {
    id: string;
    cancelAt: number | null;
    startDate: number;
    status: Stripe.Subscription.Status;
    amount: number | null;
    productName: string;
  }[];
};

export default async function ListSubscription(
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
    return StandardResponse.success<ResponseData>(response, {
      subscriptions: [],
    });

  const stripe = new Stripe(env.STRIPE_KEY, { apiVersion: "2022-11-15" });

  const listSubscriptions = await stripe.subscriptions.list({
    customer: user.stripeUserId,
  });

  const subscriptions = listSubscriptions.data.map((sub) => ({
    id: sub.id,
    cancelAt: sub.cancel_at,
    startDate: sub.start_date,
    status: sub.status,
    amount: sub.items.data[0].plan.amount,
    productId: sub.items.data[0].plan.product,
  }));

  const productIds = subscriptions.reduce(
    (accumulator: string[], currentValue) => {
      if (typeof currentValue.productId === "string")
        accumulator.push(currentValue.productId);
      return accumulator;
    },
    []
  );

  const products = await StripeLib.getStripeProductWithStripProductId(
    productIds
  );

  return StandardResponse.success<ResponseData>(response, {
    subscriptions: subscriptions.map(({ productId, ...rest }) => ({
      ...rest,
      productName:
        products
          .filter((prod) => prod.stripeProductId === productId)
          .map(({ name }) => name)[0] || "Unknown Donation",
    })),
  });
}
