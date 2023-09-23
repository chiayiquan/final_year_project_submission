import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(function () {
    return {
      subscriptions: {
        update: (id: string, params: any) => true,
        list: ({ customer }: { customer: string }) => {
          return {
            data: [
              {
                id: Test.generateID(),
                cancel_at: Date.now(),
                start_date: Date.now(),
                status: "active",
                items: {
                  data: [
                    {
                      plan: {
                        amount: 400,
                        product: "a804cf59dc2f420ab4b0eb7d8223f1df",
                      },
                    },
                  ],
                },
              },
              {
                id: Test.generateID(),
                cancel_at: Date.now(),
                start_date: Date.now(),
                status: "active",
                items: {
                  data: [
                    {
                      plan: {
                        amount: 500,
                        product: "a804cf59dc2f420ab4b0eb7d8223f1df",
                      },
                    },
                  ],
                },
              },
              {
                id: Test.generateID(),
                cancel_at: Date.now(),
                start_date: Date.now(),
                status: "active",
                items: {
                  data: [
                    {
                      plan: {
                        amount: 700,
                        product: "a804cf59dc2f420ab4b0eb7d8223f1df",
                      },
                    },
                  ],
                },
              },
            ],
          };
        },
      },
    };
  });
});

const listStripeSubscriptionsApi = async (
  data: { [key: string]: string },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post(`/stripe/unsubscribe`)
    .set("Authorization", `Bearer ${jwt}`)
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for Stripe Unsubscribe", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await listStripeSubscriptionsApi(
      { subscriptionId: "mock_id" },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should be able to unsubscribe stripe subscriptions", async () => {
    const { jwt } = await Test.createUser();
    await listStripeSubscriptionsApi({ subscriptionId: "mock_id" }, 200, jwt);
  });
});
