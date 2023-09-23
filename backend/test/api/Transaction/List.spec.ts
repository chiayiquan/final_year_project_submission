import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListTransactionApi = async (
  responseStatus: number,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/transaction/list?page=${page}&limit=${limit}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

const pk = "0x1a2463ec0375a23cf41c66d38e6e920ebb4a196fb9245c39e42bcc57fc020aa4";
describe("Test for ListTransaction", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return empty array and 0 totalTransactions when there are no transactions", async () => {
    const response = await ListTransactionApi(200);
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
    await Test.createVouchers(contract.contractId, pk, null, 25);

    const [firstResponse, secondResponse, thirdResponse, lastResponse] =
      await Promise.all([
        ListTransactionApi(200),
        ListTransactionApi(200, 1, 10),
        ListTransactionApi(200, 2, 10),
        ListTransactionApi(200, 3, 10),
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
