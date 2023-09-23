import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const viewCountryDetailApi = async (
  countryCode: string,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/country/detail/${countryCode}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const pk = "0x37ec1e5126ae5dd20f72f52caa19b7b3871518be7f0990e17b64f3a790ad8935";
jest.setTimeout(50000);

const defaultContractData = {
  pricePerVoucher: 1,
  fees: 10,
  countryCode: "SG",
  name: "Donation to Singapore",
  description: "Donate to Singapore to help people in food insecurity.",
};

describe("Test for CreateCountry", function () {
  beforeEach(async () => {
    await Test.cleanDb(["contracts"]);
  });

  beforeAll(async () => {
    await Test.cleanDb();
    const contract = await Test.createContract("SG", 1, 10, pk);
    if (contract == null) return Test.fail();
    await Test.mintMockUSDC(
      contract.mockUSDCAddress,
      contract.contractAddress,
      pk,
      10
    );
    await Test.createContract("MY", 1, 1, pk);
  });

  it("should return error", async () => {
    const response = await viewCountryDetailApi("US", 400);
    expect(response.body.error.code).toBe("UNSUPPORTED_COUNTRY");
  });

  it("should retrieve country detail", async () => {
    const response = await viewCountryDetailApi("SG", 200);
    const {
      totalVoucherIssued,
      totalVoucherUsed,
      unusedVoucherAmount,
      mealVoucherPrice,
      usdcBalance,
      managementFees,
      organizations,
      merchants,
    } = response.body.detail;
    expect(totalVoucherIssued).toBe(0);
    expect(totalVoucherUsed).toBe(0);
    expect(unusedVoucherAmount).toBe(0);
    expect(mealVoucherPrice).toBe(defaultContractData.pricePerVoucher);
    expect(usdcBalance).toBe(10);
    expect(managementFees).toBe(defaultContractData.fees);
    expect(organizations.length).toBe(0);
    expect(merchants.length).toBe(0);
  });
});
