import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import Application from "../../../src/libs/Application";

const ViewFileApi = async (
  applicationId: string,
  responseStatus: number
): Promise<request.Test> => {
  return request(app).get(`/view-file/${applicationId}`).expect(responseStatus);
};
jest.setTimeout(10000);
describe("Test for ViewFile", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("must provide valid id", async () => {
    const response = await ViewFileApi("some-random-invalid-id", 400);
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("must provide valid jwt", async () => {
    const encryptedId = await Application.lib.issue(
      "invalid-file-id",
      "invalid-jwt",
      "invalid-application-id"
    );
    const response = await ViewFileApi(encryptedId, 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("must provide valid application id", async () => {
    const { jwt } = await Test.createUser();
    const encryptedId = await Application.lib.issue(
      "invalid-file-id",
      jwt,
      "invalid-application-id"
    );
    const response = await ViewFileApi(encryptedId, 400);
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("must provide valid file id", async () => {
    const { jwt, applicationId } = await Test.createUserWithApplication();
    if (applicationId == null) return Test.fail();
    const encryptedId = await Application.lib.issue(
      "invalid-file-id",
      jwt,
      applicationId
    );
    const response = await ViewFileApi(encryptedId, 400);
    expect(response.body.error.code).toBe("INVALID_FILE");
  });

  it("should return the file buffer", async () => {
    const { jwt, applicationId } = await Test.createUserWithApplication();
    if (applicationId == null) return Test.fail();
    const application = await Application.lib.getApplicationById(applicationId);
    if (application == null) return Test.fail();
    const files = application.files;
    const firstEncryptedId = await Application.lib.issue(
      files[0].id,
      jwt,
      applicationId
    );
    const secondEncryptedId = await Application.lib.issue(
      files[1].id,
      jwt,
      applicationId
    );
    const firstFile = Test.createFile(files[0].name, files[0].fileType);
    const secondFile = Test.createFile(files[1].name, files[1].fileType);
    if (firstFile === null || secondFile === null) return Test.fail();
    const response = await Promise.all([
      ViewFileApi(firstEncryptedId, 200),
      ViewFileApi(secondEncryptedId, 200),
    ]);
    response.forEach(({ headers, body }) => {
      expect(headers["content-type"]).toBe("application/pdf");
      expect([firstFile, secondFile]).toContainEqual(body);
    });
  });
});
