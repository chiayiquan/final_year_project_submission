import db from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";

export type StripeProductSchema = Readonly<{
  id: string;
  name: string;
  description: string;
  countryCode: string;
  createdAt: number;
  stripeProductId: string;
}>;

export type PaymentOccurrence = Readonly<"ONE_TIME" | "MONTHLY">;
const paymentOccurrence: PaymentOccurrence[] = ["ONE_TIME", "MONTHLY"];
export type StripeProductPricesSchema = Readonly<{
  id: string;
  amount: number;
  createdAt: number;
  productId: string;
  paymentOccurrence: PaymentOccurrence;
  stripePriceId: string;
}>;

export type PaymentStatus = Readonly<"PENDING" | "SUCCESS" | "FAILED">;
const paymentStatus: PaymentStatus[] = ["PENDING", "SUCCESS", "FAILED"];
export type StripeDonationsSchema = Readonly<{
  id: string;
  amount: number;
  createdAt: number;
  status: PaymentStatus;
  stripeReferenceId: string;
  productId: string;
  userId: string;
}>;

export type ListStripePricesSchema = Readonly<{
  id: string;
  paymentOccurrence: PaymentOccurrence;
  amount: number;
}>;

export type StripeDonationWithProductName = Readonly<
  StripeDonationsSchema & { name: string }
>;
async function insertStripeProduct(
  data: StripeProductSchema,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<string> {
  return txns
    .insert(data)
    .into("stripeProducts")
    .returning("id")
    .then((rows) => decodeIds(rows)[0]);
}

async function insertStripeProductPrices(
  data: StripeProductPricesSchema[],
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<string[]> {
  return txns
    .insert(data)
    .into("stripeProductPrices")
    .returning("id")
    .then((rows) => decodeIds(rows));
}

async function insertStripeDonations(
  data: StripeDonationsSchema,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<string> {
  return txns
    .insert(data)
    .into("stripeDonations")
    .returning("id")
    .then((rows) => decodeIds(rows)[0]);
}

async function getStripeDonations(
  whereClause: Partial<StripeDonationsSchema>,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<StripeDonationsSchema[]> {
  return txns
    .select("*")
    .from("stripeDonations")
    .where(whereClause)
    .then(decodeStripeDonations);
}

async function listStripeProducts(
  stripeProductIds: string[]
): Promise<StripeProductSchema[]> {
  return db
    .select("*")
    .from("stripeProducts")
    .whereIn("stripeProductId", stripeProductIds)
    .then(decodeStripeProduct);
}

async function getStripeDonationsPagination(
  whereClause: Partial<StripeDonationsSchema>,
  offset: number,
  limit: number
): Promise<StripeDonationWithProductName[]> {
  return db
    .select("stripeDonations.*", "stripeProducts.name")
    .from("stripeDonations")
    .innerJoin(
      "stripeProducts",
      "stripeProducts.id",
      "stripeDonations.productId"
    )
    .where(whereClause)
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .then(decodeStripeDonationsWithProductName);
}

async function count(
  whereClause: Partial<StripeDonationsSchema>
): Promise<number> {
  return db
    .count("*")
    .from("stripeDonations")
    .andWhere(whereClause)
    .then(decodeNumber);
}

async function getStripeProductPrices(
  id: string
): Promise<StripeProductPricesSchema> {
  return db
    .select("*")
    .from("stripeProductPrices")
    .where({ id })
    .then((rows) => decodeStripeProductPrices(rows)[0]);
}

async function listStripePrices(
  whereClause: Partial<StripeProductSchema>
): Promise<ListStripePricesSchema[]> {
  return db
    .select([
      "spp.id",
      "spp.amount",
      "spp.paymentOccurrence",
      "stripeProducts.countryCode",
    ])
    .from("stripeProducts")
    .innerJoin(
      "stripeProductPrices as spp",
      "spp.productId",
      "stripeProducts.id"
    )
    .where(whereClause)
    .then(decodeListStripeProductPrices);
}

async function updateStripeDonation(
  columnToUpdate: Partial<StripeDonationsSchema>,
  whereClause: Partial<StripeDonationsSchema>,
  txns: Knex.Transaction | Knex<any, unknown[]>
): Promise<boolean> {
  try {
    await txns
      .update(columnToUpdate)
      .from("stripeDonations")
      .where(whereClause);
    return true;
  } catch (error) {
    return false;
  }
}

function decodeIds(data: any[]): string[] {
  const decodedData = JD.array(JD.object({ id: JD.string })).verify(data);
  return decodedData.map(({ id }) => id);
}

function decodeStripeProductPrices(data: any): StripeProductPricesSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      amount: JD.number,
      createdAt: JD.number,
      productId: JD.string,
      paymentOccurrence: JD.oneOf(paymentOccurrence),
      stripePriceId: JD.string,
    })
  ).verify(data);
}

function decodeStripeProduct(data: any): StripeProductSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      name: JD.string,
      description: JD.string,
      countryCode: JD.string,
      createdAt: JD.number,
      stripeProductId: JD.string,
    })
  ).verify(data);
}

function decodeListStripeProductPrices(data: any): ListStripePricesSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      amount: JD.number,
      paymentOccurrence: JD.oneOf(paymentOccurrence),
    })
  ).verify(data);
}

function decodeStripeDonations(data: any): StripeDonationsSchema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      amount: JD.number,
      createdAt: JD.number,
      status: JD.oneOf(paymentStatus),
      stripeReferenceId: JD.string,
      productId: JD.string,
      userId: JD.string,
    })
  ).verify(data);
}

function decodeStripeDonationsWithProductName(
  data: any
): StripeDonationWithProductName[] {
  return JD.array(
    JD.object({
      id: JD.string,
      amount: JD.number,
      createdAt: JD.number,
      status: JD.oneOf(paymentStatus),
      stripeReferenceId: JD.string,
      productId: JD.string,
      userId: JD.string,
      name: JD.string,
    })
  ).verify(data);
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export default {
  insertStripeProduct,
  insertStripeProductPrices,
  insertStripeDonations,
  getStripeProductPrices,
  getStripeDonations,
  updateStripeDonation,
  listStripePrices,
  count,
  getStripeDonationsPagination,
  listStripeProducts,
};
