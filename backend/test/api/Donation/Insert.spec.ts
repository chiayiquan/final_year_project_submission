import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import Donation from "../../../src/libs/Donation";

const postInsertDonationApi = async (
  data: { [key: string]: string | number | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/donation/insert/metamask")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

let defaultParams = {
  amount: 100000,
  contractAddress: "",
  hash: "0xaf496807adfe3aff5d7cdbda72bdb7bf1f10186c51757ad714730d66be277a84",
  metamaskAddress: "0xFb8D994E5529596f7e926F92E046a1B4228179Ac",
};

const pk = "0x74f830d9bf3527a319773f292ad55678c90da9bd9aa657097ffd6717f592c5b8";
jest.setTimeout(50000);

describe("Test for Insert Metamask Donation", function () {
  beforeEach(async () => {
    await Test.cleanDb(["contracts"]);
  });

  beforeAll(async () => {
    console.log("run");
    await Test.cleanDb();
    const contract = await Test.createContract("SG", 1, 10, pk);
    if (contract == null) return Test.fail();
    defaultParams = {
      ...defaultParams,
      contractAddress: contract.contractAddress,
    };
  });

  it("should check for valid jwt", async () => {
    const response = await postInsertDonationApi(
      defaultParams,
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should check for valid contract address", async () => {
    const { jwt } = await Test.createUser();
    const response = await postInsertDonationApi(
      {
        ...defaultParams,
        contractAddress: "0x0e921e300ba3829f3f464d26014ce2c17d6c88af",
      },
      400,
      jwt
    );
    expect(response.body.error.code).toBe("INVALID_CONTRACT");
  });

  it("should insert transaction", async () => {
    const { jwt, user } = await Test.createUser();
    await postInsertDonationApi(defaultParams, 200, jwt);
    const donation = await Donation.lib.getDonationByUserId(user.id);
    expect(donation.length).toBe(1);
    expect(donation[0].amount).toBe(defaultParams.amount);
    expect(donation[0].hash).toBe(defaultParams.hash);
    expect(donation[0].metamaskAddress).toBe(defaultParams.metamaskAddress);
  });
});
