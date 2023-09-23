import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const ListPersonalApi = async (
  responseStatus: number,
  jwt: string,
  page?: number,
  limit?: number
): Promise<request.Test> => {
  return request(app)
    .get(`/application/list/personal?page=${page}&limit=${limit}`)
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for ListPersonal", function () {
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
    const response = await ListPersonalApi(400, "invalid-jwt");
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should get own submitted application", async () => {
    const { jwt, user } = await Test.createUser();
    const applicationIds = await Promise.all([
      Test.createApplication(user.id),
      Test.createApplication(user.id, "MERCHANT"),
      Test.createApplication(user.id, "ORGANIZATION"),
    ]);
    const response = await ListPersonalApi(200, jwt);
    expect(response.body.totalApplications).toBe(3);
    expect(
      response.body.applications.every((application: any) =>
        applicationIds.some((id) => application.id === id)
      )
    ).toBeTruthy();
  });

  it("table pagination should work", async () => {
    const { jwt, user } = await Test.createUser();
    await Promise.all([
      Test.createApplication(user.id),
      Test.createApplication(user.id, "MERCHANT"),
      Test.createApplication(user.id, "ORGANIZATION"),
      Test.createApplication(user.id),
      Test.createApplication(user.id, "MERCHANT"),
      Test.createApplication(user.id, "ORGANIZATION"),
      Test.createApplication(user.id),
      Test.createApplication(user.id, "MERCHANT"),
      Test.createApplication(user.id, "ORGANIZATION"),
      Test.createApplication(user.id),
      Test.createApplication(user.id, "MERCHANT"),
      Test.createApplication(user.id, "ORGANIZATION"),
    ]);
    const response = await ListPersonalApi(200, jwt, 1, 10);
    expect(response.body.totalApplications).toBe(12);
    expect(response.body.applications.length).toBe(2);
  });
});
