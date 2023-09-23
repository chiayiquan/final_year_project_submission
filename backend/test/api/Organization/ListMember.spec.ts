import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListMemberApi = async (
  jwt: string | null,
  responseStatus: number,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/organization/member/list?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for ListMember", function () {
  let organizationManager: {
    user: {
      id: string;
      name: string;
      email: string;
      password: string;
      walletPassword: string;
    };
    jwt: string;
    applicationId: string | null;
  } | null = null;
  beforeAll(async () => {
    await Test.cleanDb();
    organizationManager = await Test.createUserWithApplication("ORGANIZATION");
    const members = await Promise.all(
      [...Array(5)].map(() => Test.createUser())
    );

    if (
      organizationManager == null ||
      organizationManager.applicationId == null
    )
      return Test.fail();
    await Promise.all([
      Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationManager.applicationId,
        },
        [
          organizationManager.user.id,
          ...members.map((member) => member.user.id),
        ]
      ),
      Test.updateApplicationStatus(
        organizationManager.applicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationManager.user.id
      ),
    ]);
  });
  it("should return error when there invalid session", async () => {
    const response = await ListMemberApi("invalid-jwt", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return error if a user don't belongs to an organization", async () => {
    const { jwt } = await Test.createUser();
    const response = await ListMemberApi(jwt, 400);
    expect(response.body.error.code).toBe("ORGANIZATION_NOT_FOUND");
  });

  it("should get belonged organization members", async () => {
    if (organizationManager == null) return Test.fail();
    const response = await ListMemberApi(organizationManager.jwt, 200);
    expect(response.body.members.length).toBe(6);
  });
});
