import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import * as Contract from "../../../src/libs/Contract";
import * as Transaction from "../../../src/libs/Transaction";

const postUpdateCountryApi = async (
  data: { [key: string]: string | number | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/country/update")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const pk = "0x66f85c01b77c905aa0c079f79320823fa693e69394416a7fe08ec395801e2c6d";
jest.setTimeout(50000);

const dataToUpdate = {
  voucherPrice: 5,
  fees: 3,
  countryCode: "SG",
};

describe("Test for UpdateCountry", function () {
  beforeEach(async () => {
    await Test.cleanDb(["contracts"]);
  });

  beforeAll(async () => {
    await Test.cleanDb();
    await Test.createContract("SG", 1, 1, pk);
  });

  it("should check for valid jwt", async () => {
    const response = await postUpdateCountryApi(
      dataToUpdate,
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should not allow update for roles that are not admin role", async () => {
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
      postUpdateCountryApi(dataToUpdate, 400, beneficiary.jwt),
      postUpdateCountryApi(dataToUpdate, 400, merchant.jwt),
      postUpdateCountryApi(dataToUpdate, 400, user.jwt),
      postUpdateCountryApi(dataToUpdate, 400, organizationManager.jwt),
      postUpdateCountryApi(dataToUpdate, 400, organizationMember.jwt),
    ]);

    expect(
      response.every((res) => res.body.error.code === "INSUFFICIENT_PERMISSION")
    ).toBeTruthy();
  });

  it("price must be above 0.000001", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postUpdateCountryApi(
      { ...dataToUpdate, voucherPrice: 0.0000001 },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("INVALID_VOUCHER_PRICE");

    const negativePriceResponse = await postUpdateCountryApi(
      { ...dataToUpdate, voucherPrice: -2 },
      400,
      admin.jwt
    );
    expect(negativePriceResponse.body.error.code).toBe("INVALID_VOUCHER_PRICE");
  });

  it("fees must be above 0", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postUpdateCountryApi(
      { ...dataToUpdate, fees: -2 },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("FEES_BELOW_ZERO");
  });

  it("fees must be below 100", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postUpdateCountryApi(
      { ...dataToUpdate, fees: 102 },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("FEES_ABOVE_HUNDRED");
  });

  it("fees must be below 100", async () => {
    const admin = await Test.createAdmin();

    const zeroPriceResponse = await postUpdateCountryApi(
      { ...dataToUpdate, countryCode: "MY" },
      400,
      admin.jwt
    );
    expect(zeroPriceResponse.body.error.code).toBe("CONTRACT_NOT_FOUND");
  });

  it("should be able to update contract", async () => {
    const admin = await Test.createAdmin();

    await postUpdateCountryApi(
      dataToUpdate,

      200,
      admin.jwt
    );

    const contract = await Contract.getContractByCountryCode("SG");
    if (contract == null) return Test.fail();
    expect(contract.fees).toBe(dataToUpdate.fees);
    expect(contract.voucherPrice).toBe(dataToUpdate.voucherPrice);

    const transaction = await Transaction.getTransaction({
      referenceId: contract.id,
    });
    if (transaction.length == 0) return Test.fail();
    expect(transaction.length).toBe(2);
    expect(
      transaction.every(
        ({ type }) => type === "UPDATE_FEES" || type === "UPDATE_PRICE"
      )
    ).toBeTruthy();
  });
});
