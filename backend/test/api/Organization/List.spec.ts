import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListOrganizationApi = async (
  responseStatus: number,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/organization/list?page=${page}&limit=${limit}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for ListOrganization", function () {
  beforeAll(async () => {
    await Test.cleanDb();
    const organizations = await Promise.all(
      [...Array(20)].map((_) => Test.createUserWithApplication("ORGANIZATION"))
    );

    if (
      organizations.some((organization) => organization.applicationId == null)
    )
      return Test.fail();

    await Promise.all(
      organizations.map((organization, index) => {
        if (organization.applicationId == null) return Test.fail();
        Test.createOrganization(
          {
            ...Test.organization.organizationData,
            name: `${Test.organization.organizationData.name}_${index}`,
            applicationId: organization.applicationId,
          },
          [organization.user.id]
        );
        return Test.updateApplicationStatus(
          organization.applicationId,
          "APPROVED",
          "ORGANIZATION_MANAGER",
          organization.user.id
        );
      })
    );
  });

  it("should return list of organizations", async () => {
    const [firstResponse, secondResponse, thirdResponse] = await Promise.all([
      ListOrganizationApi(200),
      ListOrganizationApi(200, 1, 10),
      ListOrganizationApi(200, 2, 10),
    ]);

    expect(firstResponse.body.organizations.length).toBe(10);
    expect(firstResponse.body.totalOrganizations).toBe(20);

    expect(secondResponse.body.organizations.length).toBe(10);
    expect(secondResponse.body.totalOrganizations).toBe(20);

    expect(thirdResponse.body.organizations.length).toBe(0);
    expect(thirdResponse.body.totalOrganizations).toBe(20);
  });
});
