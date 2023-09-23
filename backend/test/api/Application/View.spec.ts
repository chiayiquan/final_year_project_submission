import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ViewApplicationApi = async (
  jwt: string | null,
  applicationId: string,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get(`/application-detail/${applicationId}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for ViewApplication", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return error when there invalid session", async () => {
    const response = await ViewApplicationApi("invalid-jwt", "random", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should check for permission to view the application", async () => {
    // admin
    const { jwt: adminJWT } = await Test.createAdmin();

    // organization
    const {
      jwt: organizationJWT,
      user: organizationUser,
      applicationId: orgnizationApplicationId,
    } = await Test.createUserWithApplication("ORGANIZATION");
    if (orgnizationApplicationId != null) {
      await Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: orgnizationApplicationId,
        },
        [...Test.organization.members, organizationUser.id]
      );
    }

    // another country organization
    const {
      jwt: overseasOrganizationJWT,
      user: overseasOrganizationUser,
      applicationId: overseasOrgnizationApplicationId,
    } = await Test.createUserWithApplication("ORGANIZATION", Test.defaultUser, {
      ...Test.defaultApplication,
      data: { ...Test.defaultApplication.data, appliedCountry: "MY" },
    });
    if (overseasOrgnizationApplicationId != null) {
      await Test.createOrganization(
        {
          ...Test.organization.organizationData,
          applicationId: overseasOrgnizationApplicationId,
        },
        [...Test.organization.members, overseasOrganizationUser.id]
      );
    }
    // meedy
    const { applicationId: beneficiaryApplicationId, jwt: beneficiaryJWT } =
      await Test.createUserWithApplication("BENEFICIARY");

    // merchant
    const { applicationId: merchantApplicationId, jwt: merchantJWT } =
      await Test.createUserWithApplication("MERCHANT");

    if (beneficiaryApplicationId == null) return Test.fail();
    if (merchantApplicationId == null) return Test.fail();
    if (orgnizationApplicationId == null) return Test.fail();

    // test organization view document without approved application
    const unapprovedOrganizationResponse = await Promise.all([
      ViewApplicationApi(organizationJWT, beneficiaryApplicationId, 400),
      ViewApplicationApi(organizationJWT, merchantApplicationId, 400),
    ]);
    unapprovedOrganizationResponse.forEach((response) =>
      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSION")
    );

    // approve organization application
    await Test.updateApplicationStatus(
      orgnizationApplicationId,
      "APPROVED",
      "ORGANIZATION_MANAGER",
      organizationUser.id
    );

    // beneficiaryUser, admin and organization should be able to see this application
    await Promise.all([
      ViewApplicationApi(beneficiaryJWT, beneficiaryApplicationId, 200),
      ViewApplicationApi(organizationJWT, beneficiaryApplicationId, 200),
      ViewApplicationApi(adminJWT, beneficiaryApplicationId, 200),
    ]);

    // merchantUser, admin and organization should be able to see this application
    await Promise.all([
      ViewApplicationApi(merchantJWT, merchantApplicationId, 200),
      ViewApplicationApi(organizationJWT, merchantApplicationId, 200),
      ViewApplicationApi(adminJWT, merchantApplicationId, 200),
    ]);

    // admin and organization should be able to see this application
    await Promise.all([
      ViewApplicationApi(organizationJWT, orgnizationApplicationId, 200),
      ViewApplicationApi(adminJWT, orgnizationApplicationId, 200),
    ]);

    // merchant should not be able to see beneficiary user and organization application
    // beneficiary user should not be able to see merchant and organizaation application
    // organization outside of the designated country should not be able to see these applications
    const unauthorizedResponse = await Promise.all([
      ViewApplicationApi(merchantJWT, beneficiaryApplicationId, 400),
      ViewApplicationApi(merchantJWT, orgnizationApplicationId, 400),
      ViewApplicationApi(beneficiaryJWT, merchantApplicationId, 400),
      ViewApplicationApi(beneficiaryJWT, orgnizationApplicationId, 400),
      ViewApplicationApi(
        overseasOrganizationJWT,
        beneficiaryApplicationId,
        400
      ),
      ViewApplicationApi(overseasOrganizationJWT, merchantApplicationId, 400),
      ViewApplicationApi(
        overseasOrganizationJWT,
        orgnizationApplicationId,
        400
      ),
    ]);

    unauthorizedResponse.forEach((response) =>
      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSION")
    );
  });

  it("should return application details", async () => {
    const { applicationId, jwt } = await Test.createUserWithApplication(
      "MERCHANT"
    );

    if (applicationId == null) return Test.fail();

    const response = await ViewApplicationApi(jwt, applicationId, 200);
    const data = response.body;

    expect(data.application.id).toBe(applicationId);
    expect(data.application.type).toBe("MERCHANT");
    expect(data.application.appliedCountry).toBe("SG");
    expect(data.application.status).toBe("PENDING");
    expect(data.files.length).toBe(2);
    expect(data.files[0].name).not.toBeNull();
    expect(data.files[0].url).not.toBeNull();
    expect(data.files[1].name).not.toBeNull();
    expect(data.files[1].url).not.toBeNull();
  });
});
