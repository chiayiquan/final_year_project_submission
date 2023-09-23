import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import StripeProductPrices from "../../../src/utilities/stripeProductPrices.json";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(function () {
    return {
      customers: {
        create: ({ email, name }: { email: string; name: string }) =>
          "mock_user",
      },
      checkout: {
        sessions: {
          create: ({
            success_url,
            line_items,
            mode,
            customer,
            submit_type,
          }: any) => ({ url: "localhost:8080/checkout", id: "mock_id" }),
        },
      },
    };
  });
});

const postGenerateCheckoutLinkApi = async (
  data: { [key: string]: string | number | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/stripe/generate-checkout")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

describe("Test for GenerateCheckoutLink", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await postGenerateCheckoutLinkApi(
      { priceId: StripeProductPrices[0].id },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should check if stripe product id is valid", async () => {
    const { jwt } = await Test.createUser();
    const response = await postGenerateCheckoutLinkApi(
      { priceId: "invalid-id" },
      400,
      jwt
    );
    expect(response.body.error.code).toBe("INVALID_PRODUCT_PRICE");
  });

  it("should generate a checkout link", async () => {
    const { jwt } = await Test.createUser();
    const response = await postGenerateCheckoutLinkApi(
      { priceId: StripeProductPrices[StripeProductPrices.length - 1].id },
      200,
      jwt
    );
    expect(response.body.url).not.toBeNull();
  });
});
