import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListApplicationApi = async (
  responseStatus: number,
  jwt: string,
  filterType?: string,
  countryCode?: string,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(
      `/application/list?page=${page}&limit=${limit}&filterType=${filterType}&countryCode=${countryCode}`
    )
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for ListApplication", function () {
  beforeEach(async () => {
    await Test.cleanDb();
    await Promise.all([
      Test.createUserWithApplication("BENEFICIARY"),
      Test.createUserWithApplication("BENEFICIARY"),
      Test.createUserWithApplication("MERCHANT"),
      Test.createUserWithApplication("ORGANIZATION"),
      Test.createUserWithApplication("BENEFICIARY", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
      }),
      Test.createUserWithApplication("BENEFICIARY", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
      }),
      Test.createUserWithApplication("MERCHANT", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
      }),
      Test.createUserWithApplication("MERCHANT", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
      }),
      Test.createUserWithApplication("ORGANIZATION", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
      }),
    ]);
  });

  it("should check for valid jwt", async () => {
    const response = await ListApplicationApi(400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("merchant, beneficiary, user role shouldn't be able to view any applications", async () => {
    const [beneficiary, merchant, user] = await Promise.all([
      Test.createUserWithApplication("BENEFICIARY", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "IN" },
      }),
      Test.createUserWithApplication("MERCHANT", Test.defaultUser, {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "IN" },
      }),
      Test.createUser(),
    ]);

    if (beneficiary.applicationId == null || merchant.applicationId == null)
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
    ]);

    const beneficiaryResponse = await ListApplicationApi(400, beneficiary.jwt);
    expect(beneficiaryResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    const merchantResponse = await ListApplicationApi(400, merchant.jwt);
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    const userResponse = await ListApplicationApi(400, user.jwt);
    expect(userResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");
  });

  it("organizations should be able to see applications from their applied region", async () => {
    const [organizationManager, organizationMember] = await Promise.all([
      Test.createUserWithApplication("ORGANIZATION"),
      Test.createUser(),
    ]);

    if (organizationManager.applicationId == null) return Test.fail();
    await Promise.all([
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

    const organizationManagerResponse = await ListApplicationApi(
      200,
      organizationManager.jwt
    );
    expect(organizationManagerResponse.body.totalApplications).toBe(3);
    expect(
      organizationManagerResponse.body.applications.every(
        (application: any) => application.appliedCountry === "SG"
      )
    ).toBeTruthy();
    const organizationMemberResponse = await ListApplicationApi(
      200,
      organizationMember.jwt
    );
    expect(organizationMemberResponse.body.totalApplications).toBe(3);
    expect(
      organizationMemberResponse.body.applications.every(
        (application: any) => application.appliedCountry === "SG"
      )
    ).toBeTruthy();
  });

  it("organizations should be able to filter applications by merchant or beneficiary", async () => {
    const [organizationManager, organizationMember] = await Promise.all([
      Test.createUserWithApplication("ORGANIZATION"),
      Test.createUser(),
    ]);

    if (organizationManager.applicationId == null) return Test.fail();
    await Promise.all([
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

    const organizationManagerResponse = await ListApplicationApi(
      200,
      organizationManager.jwt,
      "beneficiary"
    );
    expect(organizationManagerResponse.body.totalApplications).toBe(2);
    expect(
      organizationManagerResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "SG" &&
          application.type === "BENEFICIARY"
      )
    ).toBeTruthy();
    const organizationMemberResponse = await ListApplicationApi(
      200,
      organizationMember.jwt,
      "MERCHANT"
    );
    expect(organizationMemberResponse.body.totalApplications).toBe(1);
    expect(
      organizationMemberResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "SG" && application.type === "MERCHANT"
      )
    ).toBeTruthy();
  });

  it("organizations should only be able to view all it's region applications", async () => {
    const [organizationManager, organizationMember] = await Promise.all([
      Test.createUserWithApplication("ORGANIZATION"),
      Test.createUser(),
    ]);

    if (organizationManager.applicationId == null) return Test.fail();
    await Promise.all([
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

    const organizationManagerResponse = await ListApplicationApi(
      200,
      organizationManager.jwt,
      "beneficiary",
      "MY"
    );
    expect(organizationManagerResponse.body.totalApplications).toBe(2);
    expect(
      organizationManagerResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "SG" &&
          application.type === "BENEFICIARY"
      )
    ).toBeTruthy();
  });

  it("admin should be able to view all region applications", async () => {
    const admin = await Test.createAdmin();

    const adminResponse = await ListApplicationApi(200, admin.jwt);
    expect(adminResponse.body.totalApplications).toBe(9);
    expect(
      adminResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "SG" ||
          application.appliedCountry === "MY"
      )
    ).toBeTruthy();
  });

  it("admin should be able to filter by region applications and application type", async () => {
    const admin = await Test.createAdmin();

    const organizationResponse = await ListApplicationApi(
      200,
      admin.jwt,
      "ORGANIZATION",
      "MY"
    );
    expect(organizationResponse.body.totalApplications).toBe(1);
    expect(
      organizationResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "MY" &&
          application.type === "ORGANIZATION"
      )
    ).toBeTruthy();

    const merchantResponse = await ListApplicationApi(
      200,
      admin.jwt,
      "MERCHANT",
      "SG"
    );
    expect(merchantResponse.body.totalApplications).toBe(1);
    expect(
      merchantResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "SG" && application.type === "MERCHANT"
      )
    ).toBeTruthy();

    const beneficiaryResponse = await ListApplicationApi(
      200,
      admin.jwt,
      "BENEFICIARY",
      "MY"
    );
    expect(beneficiaryResponse.body.totalApplications).toBe(2);
    expect(
      beneficiaryResponse.body.applications.every(
        (application: any) =>
          application.appliedCountry === "MY" &&
          application.type === "BENEFICIARY"
      )
    ).toBeTruthy();
  });
});
