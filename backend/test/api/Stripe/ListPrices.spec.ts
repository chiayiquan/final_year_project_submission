import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import StripeProductPrices from "../../../src/utilities/stripeProductPrices.json";

const listStripePriceApi = async (
  responseStatus: number,
  countryCode: string
): Promise<request.Test> => {
  return request(app)
    .get(`/stripe/prices/list/${countryCode}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for List Stripe Prices", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should return list of stripe prices", async () => {
    const response = await listStripePriceApi(200, "SG");

    expect(response.body.prices.length).toBe(StripeProductPrices.length);
  });

  it("should return empty list of stripe prices", async () => {
    const response = await listStripePriceApi(200, "MY");

    expect(response.body.prices.length).toBe(0);
  });
});
