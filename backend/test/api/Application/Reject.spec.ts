import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import User from "../../../src/libs/User";
import Application from "../../../src/libs/Application";

const postRejectApplicationApi = async (
  data: { [key: string]: string | null },
  responseStatus: number,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/application/reject")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

jest.setTimeout(50000);

describe("Test for RejectApplication", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const { applicationId } = await Test.createUserWithApplication();
    const response = await postRejectApplicationApi(
      { applicationId },
      400,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should check for application exist", async () => {
    const { jwt } = await Test.createUser();
    const response = await postRejectApplicationApi(
      { applicationId: "invalid_id" },
      400,
      jwt
    );
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("only admin can reject organization application", async () => {
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
    await postRejectApplicationApi({ applicationId }, 200, adminJWT);

    // normal user should not be able to reject organization application
    const userResponse = await postRejectApplicationApi(
      { applicationId },
      400,
      jwt
    );
    expect(userResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    // merchant should not be able to reject organization application
    await Test.updateUserRole(user.id, "MERCHANT");
    const merchantResponse = await postRejectApplicationApi(
      { applicationId },
      400,
      jwt
    );
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    // organization should not be able to reject organization application
    await Test.updateUserRole(user.id, "ORGANIZATION_MANAGER");
    const organizationResponse = await postRejectApplicationApi(
      { applicationId },
      400,
      jwt
    );
    expect(organizationResponse.body.error.code).toBe(
      "INSUFFICIENT_PERMISSION"
    );
  });

  it("only admin and organization can reject beneficiary application", async () => {
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
    await postRejectApplicationApi({ applicationId }, 200, adminJWT);

    // organization request
    await postRejectApplicationApi({ applicationId }, 200, organizationJWT);

    // merchant should not be able to reject beneficiary application
    const merchantResponse = await postRejectApplicationApi(
      { applicationId },
      400,
      merchantJWT
    );
    expect(merchantResponse.body.error.code).toBe("INSUFFICIENT_PERMISSION");

    // beneficiary should not be able to reject beneficiary application
    const organizationResponse = await postRejectApplicationApi(
      { applicationId },
      400,
      beneficiaryJWT
    );
    expect(organizationResponse.body.error.code).toBe(
      "INSUFFICIENT_PERMISSION"
    );
  });

  it("organization can reject beneficiary application for the country they applied on", async () => {
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
    await postRejectApplicationApi({ applicationId }, 400, organizationJWT);
  });

  it("rejected application should change application status", async () => {
    // Merchant application
    const { applicationId: merchantApplicationId, user: merchant } =
      await Test.createUserWithApplication("MERCHANT");

    const { jwt: adminJWT } = await Test.createAdmin();
    await postRejectApplicationApi(
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

    expect(merchantUserDetail.role).toBe("USER");
    expect(merchantUserApplication?.status).toBe("REJECTED");

    // Organization application
    const { user: organizationMember } = await Test.createUser({
      ...Test.defaultUser,
      email: "organization_member@example.com",
    });
    const {
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
    await postRejectApplicationApi(
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
    expect(organizationManagerDetail.role).toBe("USER");
    expect(organizationMemberDetail.role).toBe("USER");
    expect(organizationApplication?.status).toBe("REJECTED");

    // beneficiary application
    const {
      applicationId: beneficiaryUserApplicationId,
      user: beneficiaryUser,
    } = await Test.createUserWithApplication("BENEFICIARY");

    const result = await postRejectApplicationApi(
      { applicationId: beneficiaryUserApplicationId },
      200,
      adminJWT
    );

    if (beneficiaryUserApplicationId == null) return Test.fail();

    const [beneficiaryUserDetail, beneficiaryUserApplication] =
      await Promise.all([
        User.lib.getUserById(beneficiaryUser.id),
        Application.lib.getApplicationById(beneficiaryUserApplicationId),
      ]);

    if (beneficiaryUserDetail == null) return Test.fail();

    expect(beneficiaryUserDetail.role).toBe("USER");
    expect(beneficiaryUserApplication?.status).toBe("REJECTED");
  });
});
