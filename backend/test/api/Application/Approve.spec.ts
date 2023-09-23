import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import User from "../../../src/libs/User";
import Application from "../../../src/libs/Application";

const postApproveApplicationApi = async (
  data: { [key: string]: string | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/application/approve")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

describe("Test for ApproveApplication", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const { applicationId } = await Test.createUserWithApplication();
    const response = await postApproveApplicationApi(
      { applicationId },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should check for application exist", async () => {
    const { jwt } = await Test.createUser();
    const response = await postApproveApplicationApi(
      { applicationId: "invalid_id" },
      400,
      jwt
    );
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("only admin can approve organization application", async () => {
    const { user, jwt, applicationId } = await Test.createUserWithApplication(
      "ORGANIZATION"
    );
    if (applicationId != null) {
      await Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId,
        },
        [user.id]
      );
    }

    const { jwt: adminJWT } = await Test.createAdmin();
    await postApproveApplicationApi({ applicationId }, 200, adminJWT);

    // normal user should not be able to approve organization application
    const userResponse = await postApproveApplicationApi(
      { applicationId },
      400,
      jwt
    );
    expect(userResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    // merchant should not be able to approve organization application
    await Test.updateUserRole(user.id, "MERCHANT");
    const merchantResponse = await postApproveApplicationApi(
      { applicationId },
      400,
      jwt
    );
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    // organization should not be able to approve organization application
    await Test.updateUserRole(user.id, "ORGANIZATION_MANAGER");
    const organizationResponse = await postApproveApplicationApi(
      { applicationId },
      400,
      jwt
    );
    expect(organizationResponse.body.error.code).toBe(
      "INSUFFICIENT_PERMISSION"
    );
  });

  it("only admin and organization can approve beneficiary application", async () => {
    const { applicationId } = await Test.createUserWithApplication(
      "BENEFICIARY"
    );

    const {
      jwt: organizationJWT,
      applicationId: organizationApplicationId,
      user: organizationUser,
    } = await Test.createUserWithApplication("ORGANIZATION", {
      ...Test.defaultUser,
      email: "organization@example.com",
    });
    if (organizationApplicationId != null) {
      await Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationApplicationId,
        },
        [organizationUser.id]
      );
      await Test.updateApplicationStatus(
        organizationApplicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationUser.id
      );
    }

    const { jwt: merchantJWT } = await Test.createUserWithApplication(
      "MERCHANT",
      {
        ...Test.defaultUser,
        email: "merchant@example.com",
      }
    );

    const { jwt: beneficiaryJWT } = await Test.createUserWithApplication(
      "BENEFICIARY",
      {
        ...Test.defaultUser,
        email: "beneficiary@example.com",
      }
    );
    const { jwt: adminJWT } = await Test.createAdmin();

    // admin request
    await postApproveApplicationApi({ applicationId }, 200, adminJWT);

    // organization request
    await postApproveApplicationApi({ applicationId }, 200, organizationJWT);

    // merchant should not be able to approve beneficiary application
    const merchantResponse = await postApproveApplicationApi(
      { applicationId },
      400,
      merchantJWT
    );
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    // beneficiary should not be able to approve beneficiary application
    const organizationResponse = await postApproveApplicationApi(
      { applicationId },
      400,
      beneficiaryJWT
    );
    expect(organizationResponse.body.error.code).toBe(
      "INSUFFICIENT_PERMISSION"
    );
  });

  it("organization can approve beneficiary application for the country they applied on", async () => {
    const { applicationId } = await Test.createUserWithApplication(
      "BENEFICIARY"
    );

    const {
      jwt: organizationJWT,
      applicationId: organizationApplicationId,
      user: organizationUser,
    } = await Test.createUserWithApplication(
      "ORGANIZATION",
      {
        ...Test.defaultUser,
        email: "organization@example.com",
      },
      {
        ...Test.defaultApplication,
        data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
      }
    );
    if (organizationApplicationId != null) {
      await Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationApplicationId,
        },
        [organizationUser.id]
      );
      await Test.updateApplicationStatus(
        organizationApplicationId,
        "APPROVED",
        "ORGANIZATION_MANAGER",
        organizationUser.id
      );
    }
    await postApproveApplicationApi({ applicationId }, 400, organizationJWT);
  });

  it("accepted application should change user role and application status", async () => {
    // Merchant application
    const { applicationId: merchantApplicationId, user: merchant } =
      await Test.createUserWithApplication("MERCHANT");

    const { jwt: adminJWT } = await Test.createAdmin();
    await postApproveApplicationApi(
      { applicationId: merchantApplicationId },
      200,
      adminJWT
    );

    if (merchantApplicationId == null) return Test.fail();
    const [merchantUserDetail, merchantUserApplication] = await Promise.all([
      User.lib.getUserById(merchant.id),
      Application.lib.getApplicationById(merchantApplicationId),
    ]);

    if (merchantUserDetail == null) return Test.fail();

    expect(merchantUserDetail.role).toBe("MERCHANT");
    expect(merchantUserApplication?.status).toBe("APPROVED");

    // Organization application
    const { user: organizationMember } = await Test.createUser({
      ...Test.defaultUser,
      email: "organization_member@example.com",
    });
    const {
      jwt: organizationJWT,
      applicationId: organizationApplicationId,
      user: organizationManager,
    } = await Test.createUserWithApplication("ORGANIZATION", {
      ...Test.defaultUser,
      email: "organization@example.com",
    });
    if (organizationApplicationId != null) {
      await Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: organizationApplicationId,
        },
        [organizationManager.id, organizationMember.id]
      );
    }
    await postApproveApplicationApi(
      { applicationId: organizationApplicationId },
      200,
      adminJWT
    );

    if (organizationApplicationId == null) return Test.fail();
    const [
      organizationManagerDetail,
      organizationMemberDetail,
      organizationApplication,
    ] = await Promise.all([
      User.lib.getUserById(organizationManager.id),
      User.lib.getUserById(organizationMember.id),
      Application.lib.getApplicationById(organizationApplicationId),
    ]);
    if (organizationManagerDetail == null) return Test.fail();
    if (organizationMemberDetail == null) return Test.fail();
    expect(organizationManagerDetail.role).toBe("ORGANIZATION_MANAGER");
    expect(organizationMemberDetail.role).toBe("ORGANIZATION_MEMBER");
    expect(organizationApplication?.status).toBe("APPROVED");

    // beneficiary application
    const {
      applicationId: beneficiaryUserApplicationId,
      user: beneficiaryUser,
    } = await Test.createUserWithApplication("BENEFICIARY");

    await postApproveApplicationApi(
      { applicationId: beneficiaryUserApplicationId },
      200,
      organizationJWT
    );

    if (beneficiaryUserApplicationId == null) return Test.fail();

    const [beneficiaryUserDetail, beneficiaryUserApplication] =
      await Promise.all([
        User.lib.getUserById(beneficiaryUser.id),
        Application.lib.getApplicationById(beneficiaryUserApplicationId),
      ]);

    if (beneficiaryUserDetail == null) return Test.fail();

    expect(beneficiaryUserDetail.role).toBe("BENEFICIARY");
    expect(beneficiaryUserApplication?.status).toBe("APPROVED");
  });
});
