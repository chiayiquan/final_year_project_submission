import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import StripeLib, { ListStripePricesSchema } from "../../libs/Stripe";

type ResponseData = {
  prices: ListStripePricesSchema[];
};

type Params = {
  countryCode: string;
};

export default async function ListPrices(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const { countryCode } = decodeParams(request.params);
  const prices = await StripeLib.listPricesByCountry(countryCode);

  return StandardResponse.success<ResponseData>(response, {
    prices,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    countryCode: JD.string.transform((str) => str.toUpperCase()),
  }).verify(data);
}
