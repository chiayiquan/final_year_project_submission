import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const postRedeemVoucher = async (
  data: { [key: string]: string | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/voucher/redeem")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

// use new wallet private key for this test to prevent concurrency issue
const pk = "0x2922f01e240b1ff12367123a134427bf95ec10ad5ccd0ece9c7d2da014a1b78c";

describe("Test for RedeemVoucher", function () {
  let contract: {
    contractId: string;
    mockUSDCAddress: string;
    contractAddress: string;
  } | null = null;
  let encryptedVouchers: string[] | null = [];
  beforeEach(async () => {
    await Test.cleanDb(["contracts", "vouchers", "transactions"]);
  });

  beforeAll(async () => {
    await Test.cleanDb();
    contract = await Test.createContract("SG", 1, 1, pk);
    if (contract != null) {
      await Test.mintMockUSDC(
        contract.mockUSDCAddress,
        contract.contractAddress,
        pk
      );
      const vouchers = await Test.createVouchers(contract.contractId, pk);
      if (vouchers == null) return Test.fail();
      encryptedVouchers = vouchers.encryptedVoucherId;
    }
  });

  it("should check for valid jwt", async () => {
    const response = await postRedeemVoucher(
      { contractId: "invalid-contract" },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("user should have an approved application and must be a merchant", async () => {
    const [
      {
        jwt: beneficiaryJWT,
        user: beneficiaryUser,
        applicationId: beneficiaryApplicationId,
      },
      { jwt: merchantJWT },
      {
        jwt: organizationJWT,
        user: organizationUser,
        applicationId: organizationApplicationId,
      },
    ] = await Promise.all([
      Test.createUserWithApplication(),
      Test.createUserWithApplication("MERCHANT"),
      Test.createUserWithApplication("ORGANIZATION"),
    ]);

    if (beneficiaryApplicationId == null) return Test.fail();
    if (organizationApplicationId == null) return Test.fail();
    if (contract == null) return Test.fail();

    await Promise.all([
      Test.updateApplicationStatus(
        beneficiaryApplicationId,
        "APPROVED",
        "BENEFICIARY",
        beneficiaryUser.id
      ),
      Test.updateApplicationStatus(
        organizationApplicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationUser.id
      ),
    ]);

    const [beneficiaryResponse, merchantResponse, organizationResponse] =
      await Promise.all([
        postRedeemVoucher({ id: "invalid-voucher-id" }, 400, beneficiaryJWT),
        postRedeemVoucher({ id: "invalid-voucher-id" }, 400, merchantJWT),
        postRedeemVoucher({ id: "invalid-voucher-id" }, 400, organizationJWT),
      ]);

    expect(beneficiaryResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");
    expect(organizationResponse.body.error.code).toBe(
      "INSUFFICIENT_PERMISSION"
    );
  });

  it("must be a valid voucher", async () => {
    const {
      jwt: merchantJWT,
      user,
      applicationId,
    } = await Test.createUserWithApplication("MERCHANT");

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();

    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "MERCHANT",
      user.id
    );

    const merchantResponse = await postRedeemVoucher(
      { id: "invalid-voucher-id" },
      400,
      merchantJWT
    );

    expect(merchantResponse.body.error.code).toBe("INVALID_VOUCHER");
  });

  it("merchant can only redeem voucher from their country applied", async () => {
    const {
      jwt: merchantJWT,
      user,
      applicationId,
    } = await Test.createUserWithApplication("MERCHANT", Test.defaultUser, {
      ...Test.defaultApplication,
      data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
    });

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();
    if (encryptedVouchers == null) return Test.fail();
    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "MERCHANT",
      user.id
    );

    const merchantResponse = await postRedeemVoucher(
      { id: encryptedVouchers[0] },
      400,
      merchantJWT
    );

    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");
  });

  it("should be able to redeem the voucher", async () => {
    const {
      jwt: merchantJWT,
      user,
      applicationId,
    } = await Test.createUserWithApplication("MERCHANT", Test.defaultUser, {
      ...Test.defaultApplication,
      data: { ...Test.defaultApplication.data },
    });

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();
    if (encryptedVouchers == null) return Test.fail();
    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "MERCHANT",
      user.id
    );

    await postRedeemVoucher({ id: encryptedVouchers[0] }, 200, merchantJWT);
  });

  it("should not be able to redeem voucher that already redeemed", async () => {
    const {
      jwt: merchantJWT,
      user,
      applicationId,
    } = await Test.createUserWithApplication("MERCHANT", Test.defaultUser, {
      ...Test.defaultApplication,
      data: { ...Test.defaultApplication.data },
    });

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();
    if (encryptedVouchers == null) return Test.fail();
    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "MERCHANT",
      user.id
    );

    const response = await postRedeemVoucher(
      { id: encryptedVouchers[0] },
      400,
      merchantJWT
    );
    expect(response.body.error.code).toBe("TRANSACTION_EXISTED");
  });
});
