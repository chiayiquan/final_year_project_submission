import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import env from "../../env";
import Cryptos from "../../libs/Cryptos";
import * as Country from "../../libs/Country";
import * as Transaction from "../../libs/Transaction";
import * as Contract from "../../libs/Contract";
import db from "../../db";
import Stripe from "stripe";
import StripeLib from "../../libs/Stripe";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import StripeProductPrices from "../../utilities/stripeProductPrices.json";

const errors = {
  ...JWT.lib.errors,
  ...Cryptos.ContractError.errors,
  INVALID_COUNTRY: "Country code is invalid.",
  CONTRACT_EXISTED: "Contract for the country have already existed",
  INSUFFICIENT_PERMISSION: "You do not have the permission.",
  UNKNOWN_ERROR: "Unable to insert into database",
};

type ResponseData = {
  message: string;
};

type Params = {
  pricePerVoucher: number;
  fees: number;
  countryCode: string;
  name: string;
  description: string;
};

export default async function Create(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const user = await User.lib.getUserById(jwtPayload.userId);

  if (user == null || (user && user.role !== "ADMIN"))
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const { pricePerVoucher, countryCode, fees, name, description } =
    decodeParams(request.body);
  const stripe = new Stripe(env.STRIPE_KEY, { apiVersion: "2022-11-15" });

  if (pricePerVoucher < 0.000001)
    return StandardResponse.fail(response, errors, "INVALID_VOUCHER_PRICE");

  if (fees < 0)
    return StandardResponse.fail(response, errors, "FEES_BELOW_ZERO");

  if (fees > 100)
    return StandardResponse.fail(response, errors, "FEES_ABOVE_HUNDRED");

  const isValidCountry = await Country.checkCountryExist(countryCode);

  if (!isValidCountry)
    return StandardResponse.fail(response, errors, "INVALID_COUNTRY");

  const isContractExisted = await Contract.checkContractExisted(countryCode);

  if (isContractExisted)
    return StandardResponse.fail(response, errors, "CONTRACT_EXISTED");

  const { productData, prices } = await createStripeProduct(
    stripe,
    name,
    description
  );

  try {
    await db.transaction(async (txns) => {
      const contract = await Contract.createContract(
        {
          countryCode,
          voucherPrice: pricePerVoucher,
          fees,
        },
        txns
      );
      await Transaction.insertTransaction(
        [
          {
            type: "CONTRACT_DEPLOYMENT",
            from: env.WALLET_ADDRESS,
            to: env.WALLET_ADDRESS,
            referenceId: contract[0].id,
          },
        ],
        txns
      );

      return StripeLib.insertStripeProduct(
        {
          name,
          description,
          countryCode,
          stripeProductId: productData.id,
        },
        prices.map((price) => ({
          amount: price.unit_amount || 0,
          paymentOccurrence: price.type === "one_time" ? "ONE_TIME" : "MONTHLY",
          stripePriceId: price.id,
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
      "Country has been added to support, waiting for smart contract deployment.",
  });
}

async function createStripeProduct(
  stripe: Stripe,
  name: string,
  description: string
): Promise<{
  productData: Stripe.Response<Stripe.Product>;
  prices: (Stripe.Price & {
    lastResponse: {
      headers: {
        [key: string]: string;
      };
      requestId: string;
      statusCode: number;
      apiVersion?: string | undefined;
      idempotencyKey?: string | undefined;
      stripeAccount?: string | undefined;
    };
  })[];
}> {
  if (env.NODE_ENV === "test") {
    return {
      productData: {
        id: "a804cf59dc2f420ab4b0eb7d8223f1df",
        object: "product",
        active: true,
        attributes: null,
        created: Date.now(),
        description: "Stripe test entry",
        images: [],
        livemode: false,
        metadata: {},
        name: "stripe_test",
        package_dimensions: null,
        shippable: null,
        tax_code: null,
        type: "service",
        updated: Date.now(),
        url: null,
        lastResponse: {
          headers: {},
          requestId: "",
          statusCode: 200,
        },
      },
      prices: StripeProductPrices.map((product) => ({
        id: product.stripePriceId,
        object: "price",
        active: true,
        billing_scheme: "per_unit",
        created: Date.now(),
        currency: "USD",
        custom_unit_amount: null,
        livemode: false,
        lookup_key: null,
        metadata: {},
        nickname: null,
        product: product.productId,
        recurring: null,
        tax_behavior: null,
        tiers_mode: null,
        transform_quantity: null,
        type:
          product.paymentOccurrence === "ONE_TIME" ? "one_time" : "recurring",
        unit_amount: product.amount,
        unit_amount_decimal: null,
        lastResponse: {
          headers: {},
          requestId: "",
          statusCode: 200,
        },
      })),
    };
  }

  const productData = await stripe.products.create({
    name,
    description,
  });

  const defaultAmount = [
    { price: 100, paymentOccurrence: "ONE_TIME" },
    { price: 100, paymentOccurrence: "MONTHLY" },
    { price: 200, paymentOccurrence: "ONE_TIME" },
    { price: 200, paymentOccurrence: "MONTHLY" },
    { price: 500, paymentOccurrence: "ONE_TIME" },
    { price: 500, paymentOccurrence: "MONTHLY" },
    { price: 1000, paymentOccurrence: "ONE_TIME" },
    { price: 1000, paymentOccurrence: "MONTHLY" },
    { price: 5000, paymentOccurrence: "ONE_TIME" },
    { price: 5000, paymentOccurrence: "MONTHLY" },
    { price: 10000, paymentOccurrence: "ONE_TIME" },
    { price: 10000, paymentOccurrence: "MONTHLY" },
    { price: 20000, paymentOccurrence: "ONE_TIME" },
    { price: 20000, paymentOccurrence: "MONTHLY" },
    { price: 0, paymentOccurrence: "ONE_TIME" },
  ];
  const prices = await Promise.all(
    defaultAmount.map(({ price, paymentOccurrence }) =>
      price === 0
        ? stripe.prices.create({
            currency: "usd",
            custom_unit_amount: { enabled: true },
            product: productData.id,
          })
        : paymentOccurrence === "MONTHLY"
        ? stripe.prices.create({
            currency: "usd",
            product: productData.id,
            unit_amount: price,
            recurring: { interval: "month", interval_count: 1 },
          })
        : stripe.prices.create({
            currency: "usd",
            product: productData.id,
            unit_amount: price,
          })
    )
  );

  return { productData, prices };
}

function decodeParams(data: any): Params {
  return JD.object({
    pricePerVoucher: JD.number,
    fees: JD.number,
    countryCode: JD.string,
    name: JD.string,
    description: JD.string,
  }).verify(data);
}
