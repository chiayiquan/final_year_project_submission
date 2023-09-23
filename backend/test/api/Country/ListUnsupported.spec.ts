import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import CountriesJson from "../../../src/utilities/countries.json";

const ListUnsupportedCountryApi = async (
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/countries/unsupported`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const pk = "0xc2600f648e435359390e7b114681e9975c8ea99625e0dfae1daebfc98d72f861";
jest.setTimeout(50000);

describe("Test for List Unsupported Country", function () {
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

  it("should return list of unsupported countries", async () => {
    const response = await ListUnsupportedCountryApi(200);
    const { countries } = response.body;
    expect(countries.length).toBe(CountriesJson.length - addresses.length);
    expect(
      countries.every(({ countryCode }: { countryCode: string }) =>
        ["SG", "MY", "US", "IN"].every((code) => code !== countryCode)
      )
    ).toBeTruthy();
  });
});
