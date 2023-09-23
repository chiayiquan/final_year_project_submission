import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListCountryApi = async (
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/countries/supported`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const pk = "0x858f9246256bb89c1c7a3bf148ff9d6f370e6d33d592cfc44ddef350f1d3f86e";
jest.setTimeout(50000);

describe("Test for List Supported Country", function () {
  const addresses: string[] = [];
  beforeAll(async () => {
    await Test.cleanDb();
    const sgContract = await Test.createContract("SG", 1, 1, pk);
    const myContract = await Test.createContract("MY", 1, 1, pk);
    const usContract = await Test.createContract("US", 1, 1, pk);
    const inContract = await Test.createContract("IN", 1, 1, pk);

    if (
      sgContract == null ||
      myContract == null ||
      usContract == null ||
      inContract == null
    )
      return Test.fail();
    addresses.push(sgContract.contractAddress);
    addresses.push(myContract.contractAddress);
    addresses.push(usContract.contractAddress);
    addresses.push(inContract.contractAddress);
  });

  it("should return list of supported countries", async () => {
    const response = await ListCountryApi(200);
    const { countries } = response.body;
    expect(countries.length).toBe(4);
    expect(
      countries.every(
        ({ countryCode, address }: { countryCode: string; address: string }) =>
          addresses.some((addr) => addr === address) &&
          ["SG", "MY", "US", "IN"].some((code) => code === countryCode)
      )
    ).toBeTruthy();
  });
});
