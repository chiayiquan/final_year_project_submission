import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Stripe from "stripe";
import env from "../../env";
import User from "../../libs/User";
import StripeLib from "../../libs/Stripe";
import { generateID } from "../../db";
import JWT, { JWTError } from "../../libs/JWT";

const errors = {
  ...JWT.lib.errors,
  INVALID_PRODUCT_PRICE: "The provided price id is invalid.",
  CUSTOMER_CREATION: "Unable to create a customer, please try again.",
  UNABLE_TO_GENERATE_LINK: "Unable to generate donation link",
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  url: string | null;
};

type Params = {
  priceId: string;
};

export default async function GenerateCheckoutLink(
  request: express.Request,
  response: express.Response
) {
  try {
    const jwtPayload = await JWT.lib.getJWTToken(request);

    if (jwtPayload instanceof JWTError) {
      return StandardResponse.fail(response, errors, jwtPayload.name);
    }

    const { priceId } = decodeParams(request.body);

    const productPrice = await StripeLib.getStripeProductPrices(priceId);

    if (productPrice == null) {
      return StandardResponse.fail(response, errors, "INVALID_PRODUCT_PRICE");
    }

    const user = await User.lib.getUserById(jwtPayload.userId);

    if (user == null)
      return StandardResponse.fail(response, errors, "INVALID_USER");

    const stripe = new Stripe(env.STRIPE_KEY, { apiVersion: "2022-11-15" });

    let stripeUserId = user.stripeUserId;
    const newCustomer =
      stripeUserId == null
        ? await stripe.customers.create({
            email: user.email,
            name: user.name,
          })
        : null;

    if (newCustomer) {
      await User.lib.updateStripeId(user.id, newCustomer.id);
      stripeUserId = newCustomer.id;
    }

    if (stripeUserId == null) {
      return StandardResponse.fail(response, errors, "CUSTOMER_CREATION");
    }

    const dbPriceId = generateID();

    const hashedPriceId = await StripeLib.issue(dbPriceId);

    const paymentLink = await stripe.checkout.sessions.create({
      success_url: `${env.FRONT_END_URL}/donate-success/${hashedPriceId}`, // change this url
      line_items: [{ price: productPrice.stripePriceId, quantity: 1 }],
      mode:
        productPrice.paymentOccurrence === "ONE_TIME"
          ? "payment"
          : "subscription",
      customer: stripeUserId,
      submit_type:
        productPrice.paymentOccurrence === "ONE_TIME" ? "donate" : undefined,
    });
    if (paymentLink.id == null)
      return StandardResponse.fail(response, errors, "UNABLE_TO_GENERATE_LINK");

    const stripeDonation = await StripeLib.insertStripeDonations({
      id: dbPriceId,
      amount: productPrice.amount,
      status: "PENDING",
      stripeReferenceId: paymentLink.id,
      productId: productPrice.productId,
      userId: user.id,
    });

    if (stripeDonation === false)
      return StandardResponse.fail(response, errors, "UNABLE_TO_GENERATE_LINK");

    return StandardResponse.success<ResponseData>(response, {
      url: paymentLink.url,
    });
  } catch (error: any) {
    console.log(error);
    return StandardResponse.serverFail(request, response, error);
  }
}

function decodeParams(data: any): Params {
  return JD.object({
    priceId: JD.string,
  }).verify(data);
}
