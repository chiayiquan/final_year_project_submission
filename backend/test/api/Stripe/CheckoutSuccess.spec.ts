import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import StripeLib from "../../../src/libs/Stripe";
import StripeProducts from "../../../src/utilities/stripeProducts.json";

const paidSessionId = Test.generateID();
const unpaidSessionId = Test.generateID();
const nullAmountSessionId = Test.generateID();
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(function () {
    return {
      checkout: {
        sessions: {
          retrieve: (id: string) =>
            id === "paid_mocked_session_id"
              ? {
                  id: "paid_mocked_session_id",
                  amount_total: 1000,
                  currency: "usd",
                  payment_status: "paid",
                }
              : id === "unpaid_mocked_session_id"
              ? {
                  id: "unpaid_mocked_session_id",
                  amount_total: 1000,
                  currency: "usd",
                  payment_status: "pending",
                }
              : {
                  id: "invalid_amount_mocked_session_id",
                  amount_total: null,
                  currency: "usd",
                  payment_status: "paid",
                },
        },
      },
    };
  });
});

const postCheckoutSuccessApi = async (
  data: { [key: string]: string | number | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/stripe/checkout-success")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for GenerateCheckoutLink", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await postCheckoutSuccessApi(
      { checkoutSession: "invalid-id" },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should check for valid jwt", async () => {
    const { jwt } = await Test.createUser();
    const response = await postCheckoutSuccessApi(
      { checkoutSession: "invalid-id" },
      400,
      jwt
    );
    expect(response.body.error.code).toBe("INVALID_SESSION");
  });

  it("should check for payment status", async () => {
    const { jwt, user } = await Test.createUser();
    await StripeLib.insertStripeDonations({
      id: unpaidSessionId,
      amount: 400,
      status: "PENDING",
      stripeReferenceId: `unpaid_mocked_session_id`,
      productId: StripeProducts[0].id,
      userId: user.id,
    });

    const hashedId = await StripeLib.issue(unpaidSessionId);
    const response = await postCheckoutSuccessApi(
      { checkoutSession: hashedId },
      400,
      jwt
    );

    expect(response.body.error.code).toBe("DONATION_NOT_COMPLETED");
  });

  it("should check for invalid payment amount", async () => {
    const { jwt, user } = await Test.createUser();
    await StripeLib.insertStripeDonations({
      id: nullAmountSessionId,
      amount: 400,
      status: "PENDING",
      stripeReferenceId: `invalid_amount_mocked_session_id`,
      productId: StripeProducts[0].id,
      userId: user.id,
    });

    const hashedId = await StripeLib.issue(nullAmountSessionId);
    const response = await postCheckoutSuccessApi(
      { checkoutSession: hashedId },
      400,
      jwt
    );

    expect(response.body.error.code).toBe("INVALID_AMOUNT");
  });

  it("should update stripe donation record", async () => {
    const { jwt, user } = await Test.createUser();
    await StripeLib.insertStripeDonations({
      id: paidSessionId,
      amount: 400,
      status: "PENDING",
      stripeReferenceId: `paid_mocked_session_id`,
      productId: StripeProducts[0].id,
      userId: user.id,
    });

    const hashedId = await StripeLib.issue(paidSessionId);
    await postCheckoutSuccessApi({ checkoutSession: hashedId }, 200, jwt);

    const donation = await StripeLib.getStripeDonationById(paidSessionId);
    expect(donation?.status).toBe("SUCCESS");
  });
});
