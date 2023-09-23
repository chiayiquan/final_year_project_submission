import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const GetBalanceApi = async (
  jwt: string | null,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/wallet/balance`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect(responseStatus);
};

describe("Test for GetBalance", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return error when there invalid session", async () => {
    const response = await GetBalanceApi("invalid-jwt", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });
});
