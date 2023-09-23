import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import Stripe from "../../../src/libs/Stripe";
import StripeProducts from "../../../src/utilities/stripeProducts.json";

const listStripeDonationApi = async (
  responseStatus: number,
  jwt: string,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/donation/list/stripe?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for List Stripe Donation", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await listStripeDonationApi(400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return list of stripe donation", async () => {
    const { jwt, user } = await Test.createUser();
    await Promise.all(
      [...Array(12)].map((_, index) =>
        Stripe.insertStripeDonations({
          id: Test.generateID(),
          amount: 400 * (index + 1),
          status: "SUCCESS",
          stripeReferenceId: `random_id_${index + 1}`,
          productId: StripeProducts[0].id,
          userId: user.id,
        })
      )
    );

    const [defaultResponse, secondPageResponse] = await Promise.all([
      listStripeDonationApi(200, jwt),
      listStripeDonationApi(200, jwt, 1, 10),
    ]);

    expect(defaultResponse.body.stripeDonation.length).toBe(10);
    expect(secondPageResponse.body.stripeDonation.length).toBe(2);
    expect(defaultResponse.body.totalStripeDonation).toBe(12);
  });
});
