import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const DownloadApi = async (
  data: { [key: string]: string | null },
  jwt: string | null,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .post(`/wallet/download`)
    .set("Authorization", `Bearer ${jwt}`)
    .send(data)
    .expect(responseStatus);
};

describe("Test for Download", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return error when there invalid session", async () => {
    const response = await DownloadApi(
      { walletPassword: "123456" },
      "invalid-jwt",
      400
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should not be able to decrypt password", async () => {
    const { jwt } = await Test.createUser();
    const response = await DownloadApi({ walletPassword: "1234567" }, jwt, 400);
    expect(response.body.error.code).toBe("INCORRECT_WALLET_PASSWORD");
  });

  it("should be able to decrypt password", async () => {
    const { jwt } = await Test.createUser();
    const response = await DownloadApi({ walletPassword: "123456" }, jwt, 200);

    expect(response.header["content-type"]).toBe("text/plain");
    expect(response.header["content-disposition"]).toMatch(/attachment/);
    expect(response.text).not.toBeNull();
  });
});
