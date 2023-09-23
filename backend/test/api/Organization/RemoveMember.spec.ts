import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import Organization from "../../../src/libs/Organization";

const postRemoveMemberApi = async (
  data: { [key: string]: string[] },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/organization/member/remove")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for RemoveMember", function () {
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
  let organizationUser: {
    user: {
      id: string;
      name: string;
      email: string;
      password: string;
      walletPassword: string;
    };
    jwt: string;
  } | null = null;

  beforeAll(async () => {
    await Test.cleanDb();
    [organizationManager, organizationUser] = await Promise.all([
      Test.createUserWithApplication("ORGANIZATION", {
        ...Test.defaultUser,
        email: "organizationmanager@example.com",
      }),
      Test.createUser({
        ...Test.defaultUser,
        email: "toberemoved@example.com",
      }),
    ]);

    const otherUsers = await Promise.all([
      Test.createUser({
        ...Test.defaultUser,
        email: "test@example.com",
      }),
      Test.createUser({
        ...Test.defaultUser,
        email: "test1@example.com",
      }),
      Test.createUser({
        ...Test.defaultUser,
        email: "test2@example.com",
      }),
    ]);

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
        [
          organizationManager.user.id,
          organizationUser.user.id,
          ...otherUsers.map(({ user }) => user.id),
        ]
      ),
      Test.updateApplicationStatus(
        organizationManager.applicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationManager.user.id
      ),
      [...otherUsers, organizationUser].map(({ user }) =>
        Test.updateUserRole(user.id, "ORGANIZATION_MEMBER")
      ),
    ]);
  });

  it("should check for valid jwt", async () => {
    const response = await postRemoveMemberApi(
      { emails: [] },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("only organization manager can remove member", async () => {
    if (organizationUser == null) return Test.fail();
    const response = await postRemoveMemberApi(
      { emails: [] },
      400,
      organizationUser.jwt
    );
    expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSION");
  });

  it("only member in organization can be removed", async () => {
    const { user } = await Test.createUser({
      ...Test.defaultUser,
      email: "notinorganization@example.com",
    });
    if (organizationManager == null) return Test.fail();
    const response = await postRemoveMemberApi(
      { emails: ["notinorganization@example.com"] },
      400,
      organizationManager.jwt
    );
    expect(response.body.error.code).toBe("NOT_IN_ORGANIZATION");
  });

  it("organization manager cannot be removed", async () => {
    if (organizationManager == null) return Test.fail();
    const response = await postRemoveMemberApi(
      { emails: ["organizationmanager@example.com"] },
      400,
      organizationManager.jwt
    );
    expect(response.body.error.code).toBe("OWNER_ERROR");
  });

  it("should be able to remove user from organization", async () => {
    if (
      organizationManager == null ||
      organizationId == null ||
      organizationUser == null
    )
      return Test.fail();
    await postRemoveMemberApi(
      { emails: [organizationUser.user.email] },
      200,
      organizationManager.jwt
    );

    const organization = await Organization.lib.getById(organizationId);
    if (organization == null) return Test.fail();

    const idRemoved = organizationUser.user.id;
    expect(
      organization.members.every((member) => member.userId !== idRemoved)
    ).toBeTruthy();
  });
});
