import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListPersonalTransactionApi = async (
  jwt: string | null,
  responseStatus: number,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/transaction/list/personal?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

const pk = "0xcc5d5fdcbedf497f0e66001536db0e3d531f028544eb6ee13c64ba7dc0c3196d";
describe("Test for ListPersonalTransaction", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return error when there invalid session", async () => {
    const response = await ListPersonalTransactionApi("invalid-jwt", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return empty array and 0 totalTransactions when there are no transactions", async () => {
    const { jwt } = await Test.createUser();
    const response = await ListPersonalTransactionApi(jwt, 200);
    const { transactions, totalTransactions } = response.body;

    expect(transactions.length).toBe(0);
    expect(totalTransactions).toBe(0);
  });

  it("should return vouchers belonging to the user", async () => {
    const contract = await Test.createContract("SG", 1, 1, pk);
    if (contract != null) {
      await Test.mintMockUSDC(
        contract.mockUSDCAddress,
        contract.contractAddress,
        pk,
        300
      );
    }

    if (contract == null) return Test.fail();
    const { user, jwt } = await Test.createUser();
    await Test.createVouchers(contract.contractId, pk, user, 25);
    await Test.createVouchers(contract.contractId, pk, null, 21);

    const [firstResponse, secondResponse, thirdResponse, lastResponse] =
      await Promise.all([
        ListPersonalTransactionApi(jwt, 200),
        ListPersonalTransactionApi(jwt, 200, 1, 10),
        ListPersonalTransactionApi(jwt, 200, 2, 10),
        ListPersonalTransactionApi(jwt, 200, 3, 10),
      ]);

    expect(firstResponse.body.transactions.length).toBe(10);
    expect(firstResponse.body.totalTransactions).toBe(25);

    expect(secondResponse.body.transactions.length).toBe(10);
    expect(secondResponse.body.totalTransactions).toBe(25);

    expect(thirdResponse.body.transactions.length).toBe(5);
    expect(thirdResponse.body.totalTransactions).toBe(25);

    expect(lastResponse.body.transactions.length).toBe(0);
    expect(lastResponse.body.totalTransactions).toBe(25);
  });
});
