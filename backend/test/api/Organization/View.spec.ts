import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ViewOrganizationApi = async (
  organizationId: string,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/organization/view/${organizationId}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for ViewOrganization", function () {
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
    [organizationManager] = await Promise.all([
      Test.createUserWithApplication("ORGANIZATION", {
        ...Test.defaultUser,
        email: "organizationmanager@example.com",
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
      Test.createUser({
        ...Test.defaultUser,
        email: "toberemoved@example.com",
      }),
    ]);

    if (
      organizationManager == null ||
      organizationManager.applicationId == null
    )
      return Test.fail();

    const membersToAdd = [
      organizationManager.user.id,
      ...otherUsers.map((data) => data.user.id),
    ] as string[];
    [organizationId] = await Promise.all([
      Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationManager.applicationId,
          addresses: [
            ...Test.organization.organizationData.addresses,
            "some random address",
            "another random address",
          ],
        },
        membersToAdd
      ),
      Test.updateApplicationStatus(
        organizationManager.applicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationManager.user.id
      ),
      [...otherUsers].map(({ user }) =>
        Test.updateUserRole(user.id, "ORGANIZATION_MEMBER")
      ),
    ]);
  });

  it("should return error if the organization is not valid", async () => {
    const response = await ViewOrganizationApi("random", 400);
    expect(response.body.error.code).toBe("INVALID_ORGANIZATION");
  });

  it("should return organization details", async () => {
    if (organizationId == null) return Test.fail();
    const response = await ViewOrganizationApi(organizationId, 200);

    const { organization } = response.body;
    expect(organization.id).toBe(organizationId);
    expect(organization.name).toBe(Test.organization.organizationData.name);
    expect(organization.applicationId).not.toBeNull();
    expect(organization.addresses.length).toBe(3);
    expect(
      organization.addresses.every(({ address }: { address: string }) =>
        [
          ...Test.organization.organizationData.addresses,
          "some random address",
          "another random address",
        ].includes(address)
      )
    ).toBeTruthy();
  });
});
