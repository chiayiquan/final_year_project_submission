import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const listMetamaskDonationApi = async (
  responseStatus: number,
  jwt: string,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/donation/list/metamask?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const postInsertDonationApi = async (
  data: { [key: string]: string | number | null },
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/donation/insert/metamask")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/);
};

let defaultParams = {
  amount: 100000,
  contractAddress: "",
  hash: "0xaf496807adfe3aff5d7cdbda72bdb7bf1f10186c51757ad714730d66be277a84",
  metamaskAddress: "0xFb8D994E5529596f7e926F92E046a1B4228179Ac",
};

const pk = "0xe92e23781ea8e33be1e14b2d8a0de2c2afaa8875d4b519fffcf9cb656a0e3acd";
jest.setTimeout(50000);

describe("Test for List Metamask Donation", function () {
  beforeEach(async () => {
    await Test.cleanDb(["contracts"]);
  });

  beforeAll(async () => {
    await Test.cleanDb();
    const contract = await Test.createContract("SG", 1, 10, pk);
    if (contract == null) return Test.fail();
    defaultParams = {
      ...defaultParams,
      contractAddress: contract.contractAddress,
    };
  });

  it("should check for valid jwt", async () => {
    const response = await listMetamaskDonationApi(400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return list of metamask donation", async () => {
    const { jwt } = await Test.createUser();
    await Promise.all([
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
      postInsertDonationApi(defaultParams, jwt),
    ]);

    const [defaultResponse, secondPageResponse] = await Promise.all([
      listMetamaskDonationApi(200, jwt),
      listMetamaskDonationApi(200, jwt, 1, 10),
    ]);

    expect(defaultResponse.body.metamaskDonation.length).toBe(10);
    expect(secondPageResponse.body.metamaskDonation.length).toBe(2);
    expect(defaultResponse.body.totalMetamaskDonation).toBe(12);
  });
});
