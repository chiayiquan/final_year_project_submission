import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(function () {
    return {
      subscriptions: {
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
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .get(`/stripe/subscription/list`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for List Stripe Subscriptions", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await listStripeSubscriptionsApi(400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return list of stripe subscriptions", async () => {
    const { jwt } = await Test.createUser();
    const response = await listStripeSubscriptionsApi(200, jwt);

    expect(response.body.subscriptions.length).toBe(3);
  });
});
