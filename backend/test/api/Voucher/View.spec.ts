import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ViewVoucherApi = async (
  jwt: string | null,
  id: string,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/voucher/view/${id}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

const pk = "0x3d87bfc6f0e4e3baafc21eb89157054f3d7a7eae8efabd131a4e72c930ba32b3";

describe("Test for ViewVoucher", function () {
  type UserData = {
    user: {
      id: string;
      name: string;
      email: string;
      password: string;
      walletPassword: string;
    };
    jwt: string;
    applicationId: string | null;
  };
  let firstUser: UserData | null = null;
  let voucherIds: string[] = [];
  beforeAll(async () => {
    await Test.cleanDb();
    firstUser = await Test.createUserWithApplication();

    const contract = await Test.createContract("SG", 1, 1, pk);

    if (contract != null) {
      await Test.mintMockUSDC(
        contract.mockUSDCAddress,
        contract.contractAddress,
        pk,
        300
      );
    }

    if (firstUser.applicationId == null || contract == null) return Test.fail();
    await Test.updateApplicationStatus(
      firstUser.applicationId,
      "APPROVED",
      "BENEFICIARY",
      firstUser.user.id
    );

    const vouchers = await Test.createVouchers(
      contract.contractId,
      pk,
      firstUser.user,
      30
    );
    if (vouchers == null) return Test.fail();
    voucherIds = vouchers.voucherIds;
  });

  it("should return error when there invalid session", async () => {
    const response = await ViewVoucherApi("invalid-jwt", "random", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("only owner of the voucher can view", async () => {
    if (voucherIds.length === 0) return Test.fail();
    const { jwt } = await Test.createUser();
    const response = await ViewVoucherApi(jwt, voucherIds[0], 400);
    expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSION");
  });

  it("should return voucher detail and transactions", async () => {
    if (voucherIds.length === 0 || firstUser == null) return Test.fail();
    const response = await ViewVoucherApi(firstUser.jwt, voucherIds[0], 200);

    const { url, voucherDetail, transactions } = response.body;
    expect(url).not.toBeNull();
    expect(voucherDetail.id).toBe(voucherIds[0]);
    expect(voucherDetail.owner).toBe(firstUser.user.id);
    expect(transactions.length).toBe(1);
  });
});
