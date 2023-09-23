import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import * as Contract from "../../../src/libs/Contract";
import * as Transaction from "../../../src/libs/Transaction";

const postCreateCountryApi = async (
  data: { [key: string]: string | number | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/country/create")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const pk = "0xae27b4d35b8279583945b7851fcbacacb988e41d052ac50a3475b31864b6813c";
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
    await Test.createContract("SG", 1, 1, pk);
  });

  it("should check for valid jwt", async () => {
    const response = await postCreateCountryApi(
      defaultContractData,
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("only admin can create new contract", async () => {
    const [
      beneficiary,
      merchant,
      user,
      organizationManager,
      organizationMember,
    ] = await Promise.all([
      Test.createUserWithApplication("BENEFICIARY"),
      Test.createUserWithApplication("MERCHANT"),
      Test.createUser(),
      Test.createUserWithApplication("ORGANIZATION"),
      Test.createUser(),
    ]);

    if (
      beneficiary.applicationId == null ||
      merchant.applicationId == null ||
      organizationManager.applicationId == null
    )
      return Test.fail();
    await Promise.all([
      Test.updateApplicationStatus(
        beneficiary.applicationId,
        "APPROVED",
        "BENEFICIARY",
        beneficiary.user.id
      ),
      Test.updateApplicationStatus(
        merchant.applicationId,
        "APPROVED",
        "MERCHANT",
        merchant.user.id
      ),
      Test.updateApplicationStatus(
        organizationManager.applicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationManager.user.id
      ),
      Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationManager.applicationId,
        },
        [organizationManager.user.id, organizationMember.user.id]
      ),
    ]);

    const response = await Promise.all([
      postCreateCountryApi(defaultContractData, 400, beneficiary.jwt),
      postCreateCountryApi(defaultContractData, 400, merchant.jwt),
      postCreateCountryApi(defaultContractData, 400, user.jwt),
      postCreateCountryApi(defaultContractData, 400, organizationManager.jwt),
      postCreateCountryApi(defaultContractData, 400, organizationMember.jwt),
    ]);

    expect(
      response.every((res) => res.body.error.code === "INSUFFICIENT_PERMISSION")
    ).toBeTruthy();
  });

  it("price must be above 0", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postCreateCountryApi(
      { ...defaultContractData, pricePerVoucher: 0 },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("INVALID_VOUCHER_PRICE");

    const negativePriceResponse = await postCreateCountryApi(
      { ...defaultContractData, pricePerVoucher: -2 },
      400,
      admin.jwt
    );
    expect(negativePriceResponse.body.error.code).toBe("INVALID_VOUCHER_PRICE");
  });

  it("fees must be above 0", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postCreateCountryApi(
      { ...defaultContractData, fees: -2 },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("FEES_BELOW_ZERO");
  });

  it("fees must be below 100", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postCreateCountryApi(
      { ...defaultContractData, fees: 102 },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("FEES_ABOVE_HUNDRED");
  });

  it("country must be a valid country", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postCreateCountryApi(
      { ...defaultContractData, countryCode: "INVALID" },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("INVALID_COUNTRY");
  });

  it("country must not be an existing supported country", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postCreateCountryApi(
      { ...defaultContractData },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("CONTRACT_EXISTED");
  });

  it("should be able to create a new contract", async () => {
    const admin = await Test.createAdmin();

    await postCreateCountryApi(
      {
        ...defaultContractData,
        countryCode: "MY",
        name: "Donation to Malaysia",
        description: "Donate to Malaysia to help people in food insecurity.",
      },
      200,
      admin.jwt
    );

    const contract = await Contract.getContractByCountryCode("MY");
    if (contract == null) return Test.fail();
    expect(contract.fees).toBe(defaultContractData.fees);
    expect(contract.voucherPrice).toBe(defaultContractData.pricePerVoucher);

    const transaction = await Transaction.getTransaction({
      referenceId: contract.id,
    });
    if (transaction.length == 0) return Test.fail();
    expect(transaction[0].type).toBe("CONTRACT_DEPLOYMENT");
  });
});
