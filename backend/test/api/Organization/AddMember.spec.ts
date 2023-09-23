import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import Organization from "../../../src/libs/Organization";

const postAddMemberApi = async (
  data: { [key: string]: string[] },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/organization/member/add")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for AddMember", function () {
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
  let organizationId: string | null = null;

  beforeAll(async () => {
    await Test.cleanDb();
    organizationManager = await Test.createUserWithApplication("ORGANIZATION");

    if (
      organizationManager == null ||
      organizationManager.applicationId == null
    )
      return Test.fail();
    [organizationId] = await Promise.all([
      Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationManager.applicationId,
        },
        [organizationManager.user.id]
      ),
      Test.updateApplicationStatus(
        organizationManager.applicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationManager.user.id
      ),
    ]);
  });

  it("should check for valid jwt", async () => {
    const response = await postAddMemberApi({ emails: [] }, 400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should be organization manager role to add member", async () => {
    const [beneficiary, merchant, user, organizationMember, admin] =
      await Promise.all([
        Test.createUserWithApplication("BENEFICIARY"),
        Test.createUserWithApplication("MERCHANT"),
        Test.createUser(),
        Test.createUser(),
        Test.createAdmin(),
      ]);

    if (
      beneficiary.applicationId == null ||
      merchant.applicationId == null ||
      organizationManager == null ||
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
      Test.addMemberToOrganization(organizationManager.applicationId, [
        organizationMember.user.id,
      ]),
    ]);

    const response = await Promise.all([
      postAddMemberApi(
        { emails: ["invalid@example.com"] },
        400,
        beneficiary.jwt
      ),
      postAddMemberApi({ emails: ["invalid@example.com"] }, 400, merchant.jwt),
      postAddMemberApi({ emails: ["invalid@example.com"] }, 400, user.jwt),
      postAddMemberApi(
        { emails: ["invalid@example.com"] },
        400,
        organizationMember.jwt
      ),
      postAddMemberApi({ emails: ["invalid@example.com"] }, 400, admin.jwt),
    ]);

    expect(
      response.every((res) => res.body.error.code === "INSUFFICIENT_PERMISSION")
    ).toBeTruthy();
  });

  it("should be valid user", async () => {
    const user = await Test.createUser({
      ...Test.defaultUser,
      email: "newuser@example.com",
    });

    if (
      organizationManager == null ||
      organizationManager.applicationId == null
    )
      return Test.fail();

    const response = await postAddMemberApi(
      { emails: ["invalid@example.com", user.user.email] },
      400,
      organizationManager.jwt
    );
    expect(response.body.error.code).toBe("INVALID_USER");
  });

  it("should be able to add new member", async () => {
    const user = await Test.createUser({
      ...Test.defaultUser,
      email: "newmember@example.com",
    });

    if (
      organizationManager == null ||
      organizationManager.applicationId == null ||
      organizationId == null
    )
      return Test.fail();

    await postAddMemberApi(
      { emails: [user.user.email] },
      200,
      organizationManager.jwt
    );

    const organization = await Organization.lib.getById(organizationId);

    if (organization == null) return Test.fail();

    expect(organization.members.length).toBe(2);
    expect(
      organization.members.some((member) => member.userId === user.user.id)
    ).toBeTruthy();
  });
});
