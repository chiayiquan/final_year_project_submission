import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListVoucherApi = async (
  jwt: string | null,
  responseStatus: number,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/voucher/list?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

const pk = "0x65e8ecaadddf4e5a14c146decedc63aa597769931273a1c134484a1b7a2580c8";
describe("Test for ListVoucher", function () {
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
  let firstUser: UserData | null = null,
    secondUser: UserData | null = null;
  beforeAll(async () => {
    await Test.cleanDb();
    [firstUser, secondUser] = await Promise.all([
      Test.createUserWithApplication(),
      Test.createUserWithApplication(),
    ]);
    const contract = await Test.createContract("SG", 1, 1, pk);

    if (contract != null) {
      await Test.mintMockUSDC(
        contract.mockUSDCAddress,
        contract.contractAddress,
        pk,
        300
      );
    }

    if (
      firstUser.applicationId == null ||
      secondUser.applicationId == null ||
      contract == null
    )
      return Test.fail();
    await Promise.all([
      Test.updateApplicationStatus(
        firstUser.applicationId,
        "APPROVED",
        "BENEFICIARY",
        firstUser.user.id
      ),
      Test.updateApplicationStatus(
        secondUser.applicationId,
        "APPROVED",
        "BENEFICIARY",
        secondUser.user.id
      ),
    ]);

    await Test.createVouchers(contract.contractId, pk, firstUser.user, 30);
    await Test.createVouchers(contract.contractId, pk, secondUser.user, 30);
  });

  it("should return error when there invalid session", async () => {
    const response = await ListVoucherApi("invalid-jwt", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return vouchers belonging to the user", async () => {
    if (firstUser == null) return Test.fail();
    const [firstResponse, secondResponse, thirdResponse, fourthResponse] =
      await Promise.all([
        ListVoucherApi(firstUser.jwt, 200),
        ListVoucherApi(firstUser.jwt, 200, 1, 10),
        ListVoucherApi(firstUser.jwt, 200, 2, 10),
        ListVoucherApi(firstUser.jwt, 200, 3, 10),
      ]);
    const firstResponseVouchers: {
      id: string;
      status: string;
      createdAt: number;
      owner: string;
    }[] = firstResponse.body.vouchers;

    expect(firstResponse.body.totalVouchers).toBe(30);
    expect(firstResponseVouchers.length).toBe(10);
    expect(
      firstResponseVouchers.every(({ owner }) => owner === firstUser?.user.id)
    ).toBeTruthy();

    const secondResponseVouchers: {
      id: string;
      status: string;
      createdAt: number;
      owner: string;
    }[] = secondResponse.body.vouchers;

    expect(secondResponseVouchers.length).toBe(10);
    expect(
      secondResponseVouchers.every(({ owner }) => owner === firstUser?.user.id)
    ).toBeTruthy();

    const thirdResponseVouchers: {
      id: string;
      status: string;
      createdAt: number;
      owner: string;
    }[] = thirdResponse.body.vouchers;

    expect(thirdResponseVouchers.length).toBe(10);
    expect(
      thirdResponseVouchers.every(({ owner }) => owner === firstUser?.user.id)
    ).toBeTruthy();

    const fourthResponseVouchers: {
      id: string;
      status: string;
      createdAt: number;
      owner: string;
    }[] = fourthResponse.body.vouchers;

    expect(fourthResponseVouchers.length).toBe(0);
  });
});
