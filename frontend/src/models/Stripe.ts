import * as JD from "decoders";

type PaymentOccurrence = Readonly<"ONE_TIME" | "MONTHLY">;
const paymentOccurrence: PaymentOccurrence[] = ["ONE_TIME", "MONTHLY"];

type ListStripePricesSchema = Readonly<{
  id: string;
  paymentOccurrence: PaymentOccurrence;
  amount: number;
}>;

function decodeListStripeProductPrices(data: any): {
  prices: ListStripePricesSchema[];
} {
  return JD.object({
    prices: JD.array(
      JD.object({
        id: JD.string,
        amount: JD.number,
        paymentOccurrence: JD.oneOf(paymentOccurrence),
      })
    ),
  }).verify(data);
}

export { decodeListStripeProductPrices };
