import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import * as Voucher from "../../../src/libs/Voucher";
import * as Transaction from "../../../src/libs/Transaction";

const postGenerateVoucher = async (
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/voucher/generate")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

const pk = "0x106cf20c488b7b22156ecc794f32bca2eaef08b5f36a17cb0c29f6cc654c4ce5";
describe("Test for GenerateVoucher", function () {
  let contract: {
    contractId: string;
    mockUSDCAddress: string;
    contractAddress: string;
  } | null = null;
  beforeEach(async () => {
    await Test.cleanDb(["contracts"]);
  });

  beforeAll(async () => {
    await Test.cleanDb();
    contract = await Test.createContract("SG", 1, 1, pk);
  });

  it("should check for valid jwt", async () => {
    const response = await postGenerateVoucher(400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("user should have an application", async () => {
    const { jwt } = await Test.createUser();

    if (contract == null) return Test.fail();
    const response = await postGenerateVoucher(400, jwt);
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("user should have an approved application and must be a beneficiary", async () => {
    const [
      { jwt: beneficiaryJWT },
      {
        jwt: merchantJWT,
        user: merchantUser,
        applicationId: merchantApplicationId,
      },
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

    if (merchantApplicationId == null) return Test.fail();
    if (organizationApplicationId == null) return Test.fail();
    if (contract == null) return Test.fail();

    await Promise.all([
      Test.updateApplicationStatus(
        merchantApplicationId,
        "APPROVED",
        "MERCHANT",
        merchantUser.id
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
        postGenerateVoucher(400, beneficiaryJWT),
        postGenerateVoucher(400, merchantJWT),
        postGenerateVoucher(400, organizationJWT),
      ]);
    expect(beneficiaryResponse.body.error.code).toBe("INSUFFICIENT_PRIVILEGE");
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PRIVILEGE");
    expect(organizationResponse.body.error.code).toBe("INSUFFICIENT_PRIVILEGE");
  });

  it("should not be able to generate voucher if there are no balance", async () => {
    const {
      jwt: beneficiaryJWT,
      applicationId,
      user,
    } = await Test.createUserWithApplication();

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();
    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "BENEFICIARY",
      user.id
    );

    const beneficiaryResponse = await postGenerateVoucher(400, beneficiaryJWT);
    expect(beneficiaryResponse.body.error.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("should not be able to generate voucher if hit the maximum generated vouchers per week", async () => {
    const {
      jwt: beneficiaryJWT,
      applicationId,
      user,
    } = await Test.createUserWithApplication();

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();
    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "BENEFICIARY",
      user.id
    );

    await Test.mintMockUSDC(
      contract.mockUSDCAddress,
      contract.contractAddress,
      pk
    );

    await postGenerateVoucher(200, beneficiaryJWT);

    const beneficiaryResponse = await postGenerateVoucher(400, beneficiaryJWT);
    expect(beneficiaryResponse.body.error.code).toBe("MAXIMUM_GENERATION");
  });

  it("should generate vouchers successfully", async () => {
    const {
      jwt: beneficiaryJWT,
      applicationId,
      user,
    } = await Test.createUserWithApplication();

    if (applicationId == null) return Test.fail();
    if (contract == null) return Test.fail();
    await Test.updateApplicationStatus(
      applicationId,
      "APPROVED",
      "BENEFICIARY",
      user.id
    );

    await Test.mintMockUSDC(
      contract.mockUSDCAddress,
      contract.contractAddress,
      pk
    );

    await postGenerateVoucher(200, beneficiaryJWT);

    const dbVouchers = await Voucher.getVoucher({ owner: user.id });
    expect(dbVouchers.length).toBe(21);

    const transactions = await Transaction.getPendingTransaction();
    expect(transactions.length).toBe(21);
    transactions.forEach((transaction) => {
      expect(transaction.status).toBe("PENDING");
    });
  });
});
