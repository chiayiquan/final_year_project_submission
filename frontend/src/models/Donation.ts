import * as JD from "decoders";
import Conversion from "../libs/conversion";

type PaymentStatus = Readonly<"PENDING" | "SUCCESS" | "FAILED">;
const paymentStatus: PaymentStatus[] = ["PENDING", "SUCCESS", "FAILED"];

export type StripeDonationsSchema = Readonly<{
  id: string;
  amount: number;
  createdAt: string;
  status: PaymentStatus;
  stripeReferenceId: string;
  productId: string;
  userId: string;
  name: string;
}>;

export type MetamaskDonationsSchema = Readonly<{
  id: string;
  amount: number;
  userId: string;
  contractId: string;
  hash: string;
  metamaskAddress: string;
  createdAt: string;
  address: string;
}>;

type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

const subscriptionStatus: SubscriptionStatus[] = [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "paused",
  "trialing",
  "unpaid",
];
export type SubscriptionSchema = Readonly<{
  id: string;
  cancelAt: string | null;
  startDate: string;
  status: SubscriptionStatus;
  amount: number | null;
  productName: string;
}>;

function decodeStripeDonations(data: any): {
  stripeDonation: StripeDonationsSchema[];
  totalStripeDonation: number;
} {
  return JD.object({
    stripeDonation: JD.array(
      JD.object({
        id: JD.string,
        amount: JD.number.transform((num) => num / 100),
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
        status: JD.oneOf(paymentStatus),
        stripeReferenceId: JD.string,
        productId: JD.string,
        userId: JD.string,
        name: JD.string,
      })
    ),
    totalStripeDonation: JD.number,
  }).verify(data);
}

function decodeMetamaskDonation(data: any): {
  metamaskDonation: MetamaskDonationsSchema[];
  totalMetamaskDonation: number;
} {
  return JD.object({
    metamaskDonation: JD.array(
      JD.object({
        id: JD.string,
        amount: JD.number.transform((num) => Conversion.convertFromUAvax(num)),
        userId: JD.string,
        contractId: JD.string,
        hash: JD.string,
        metamaskAddress: JD.string,
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
        address: JD.string,
      })
    ),
    totalMetamaskDonation: JD.number,
  }).verify(data);
}

function decodeSubscription(data: any): {
  subscriptions: SubscriptionSchema[];
} {
  return JD.object({
    subscriptions: JD.array(
      JD.object({
        id: JD.string,
        cancelAt: JD.nullable(
          JD.number.transform((epoch) =>
            new Date(epoch * 1000).toLocaleString()
          )
        ),
        startDate: JD.number.transform((epoch) =>
          new Date(epoch * 1000).toLocaleString()
        ),
        status: JD.oneOf(subscriptionStatus),
        amount: JD.nullable(JD.number.transform((num) => num / 100)),
        productName: JD.string,
      })
    ),
  }).verify(data);
}

export default {
  decodeStripeDonations,
  decodeMetamaskDonation,
  decodeSubscription,
};
