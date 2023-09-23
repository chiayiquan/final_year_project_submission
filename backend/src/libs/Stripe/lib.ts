import Stripe, {
  PaymentOccurrence,
  StripeDonationsSchema,
  StripeProductPricesSchema,
  PaymentStatus,
  ListStripePricesSchema,
  StripeDonationWithProductName,
  StripeProductSchema,
} from "./model";
import { Knex } from "knex";
import db, { generateID } from "../../db";
import jwt from "jsonwebtoken";
import env from "../../env";
import * as JD from "decoders";

const { STRIPE_URL_SECRET } = env;
async function insertStripeProduct(
  productDetails: {
    name: string;
    description: string;
    countryCode: string;
    stripeProductId: string;
  },
  productPriceList: {
    amount: number;
    paymentOccurrence: PaymentOccurrence;
    stripePriceId: string;
  }[],
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  try {
    const productId = await Stripe.insertStripeProduct(
      { ...productDetails, id: generateID(), createdAt: Date.now() },
      txns
    );
    await Stripe.insertStripeProductPrices(
      productPriceList.map((productPrice) => ({
        ...productPrice,
        id: generateID(),
        productId,
        createdAt: Date.now(),
      })),
      txns
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getStripeProductPrices(
  id: string
): Promise<StripeProductPricesSchema> {
  return Stripe.getStripeProductPrices(id);
}

async function insertStripeDonations(
  data: {
    id: string;
    amount: number;
    status: PaymentStatus;
    stripeReferenceId: string;
    productId: string;
    userId: string;
  },
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  try {
    await Stripe.insertStripeDonations(
      { ...data, createdAt: Date.now() },
      txns
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getStripeDonationById(
  id: string
): Promise<StripeDonationsSchema | null> {
  try {
    return (await Stripe.getStripeDonations({ id }, db))[0];
  } catch (error) {
    return null;
  }
}

async function getStripeDonationByUserId(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<StripeDonationWithProductName[]> {
  return Stripe.getStripeDonationsPagination({ userId }, page * limit, limit);
}

async function getTotalStripeDonationByUserId(userId: string): Promise<number> {
  return Stripe.count({ userId });
}

async function getStripeProductWithStripProductId(
  stripeProductIds: string[]
): Promise<StripeProductSchema[]> {
  return Stripe.listStripeProducts(stripeProductIds);
}

async function updateStripeDonation(
  dataToUpdate: { amount: number; status: PaymentStatus },
  id: string,
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<boolean> {
  return Stripe.updateStripeDonation(dataToUpdate, { id }, txns);
}

async function listPricesByCountry(
  countryCode: string
): Promise<ListStripePricesSchema[]> {
  return Stripe.listStripePrices({ countryCode });
}

type StripeCheckoutPayload = Readonly<{ id: string }>;
async function issue(id: string): Promise<string> {
  return jwt.sign({ id }, STRIPE_URL_SECRET);
}

function decodePayload(data: any): StripeCheckoutPayload {
  return JD.object({
    id: JD.string,
  }).verify(data);
}

class StripeCheckoutError extends Error {
  name: keyof typeof errors;
  constructor(code: keyof typeof errors) {
    super(errors[code]);
    this.name = code;
  }
}

const errors = {
  INVALID_SESSION: "Invalid checkout session provided.",
};

function verifyToken(
  token: string
): StripeCheckoutPayload | StripeCheckoutError {
  try {
    const payload = jwt.verify(token, STRIPE_URL_SECRET);
    return decodePayload(payload);
  } catch (error) {
    return new StripeCheckoutError("INVALID_SESSION");
  }
}
export default {
  insertStripeProduct,
  getStripeProductPrices,
  issue,
  insertStripeDonations,
  verifyToken,
  errors,
  StripeCheckoutError,
  getStripeDonationById,
  updateStripeDonation,
  listPricesByCountry,
  getStripeDonationByUserId,
  getTotalStripeDonationByUserId,
  getStripeProductWithStripProductId,
};
