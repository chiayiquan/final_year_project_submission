import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import Transfer, { TransferType } from "../../../src/libs/Transfer";

const ListWalletTransferApi = async (
  jwt: string | null,
  responseStatus: number,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/wallet/history?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect(responseStatus);
};

describe("Test for ListWalletTransfer", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return error when there invalid session", async () => {
    const response = await ListWalletTransferApi("invalid-jwt", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return list of transfer", async () => {
    const { user, jwt } = await Test.createUser();
    const transfers: {
      transferType: TransferType;
      from: string;
      to: string;
      value: number;
    }[] = [
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },

      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },

      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
      { transferType: "TRANSFER", from: user.id, to: user.id, value: 10000 },
    ];
    await Transfer.lib.insertTransfer(transfers);
    const [firstResponse, secondResponse, thirdResponse] = await Promise.all([
      ListWalletTransferApi(jwt, 200),
      ListWalletTransferApi(jwt, 200, 1, 10),
      ListWalletTransferApi(jwt, 200, 2, 10),
    ]);

    expect(firstResponse.body.totalTransfers).toBe(15);
    expect(firstResponse.body.transfers.length).toBe(10);

    expect(secondResponse.body.totalTransfers).toBe(15);
    expect(secondResponse.body.transfers.length).toBe(5);

    expect(thirdResponse.body.totalTransfers).toBe(15);
    expect(thirdResponse.body.transfers.length).toBe(0);
  });
});
