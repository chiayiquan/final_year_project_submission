import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import path from "path";
import Application from "../../../src/libs/Application";
import fs from "fs";
import File from "../../../src/libs/File";
import Organization from "../../../src/libs/Organization";

const postUploadOrganizationApi = async (
  data: { [key: string]: string | null | {} },
  responseStatus: number,
  identificationFile: string,
  certificateFile: string,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/application/organization")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .field("data", JSON.stringify(data))
    .attach("CERTIFICATE", certificateFile)
    .attach("IDENTIFICATION", identificationFile)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const dummyIdFile = path.resolve(
  __dirname,
  "../../sampleFile/identification.pdf"
);

// file sample source: https://www.acra.gov.sg/how-to-guides/buying-information/certificates
// https://www.acra.gov.sg/docs/default-source/bp-and-bc/business-certificate---company-v8.pdf
const dummyBusinessCertificate = path.resolve(
  __dirname,
  "../../sampleFile/businessCertificate.pdf"
);

jest.setTimeout(50000);

describe("Test for UploadOrganization", function () {
  beforeEach(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await postUploadOrganizationApi(
      { countryCode: "SG" },
      400,
      dummyIdFile,
      dummyBusinessCertificate,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should upload identification file and proof of a company", async () => {
    const { jwt, user } = await Test.createUser();
    await postUploadOrganizationApi(
      {
        countryCode: "SG",
        ...Test.organization,
        members: [...Test.organization.members, user.email],
        personalInformation: Test.defaultPersonalInformation,
      },
      200,
      dummyIdFile,
      dummyBusinessCertificate,
      jwt
    );

    const application = await Application.lib.getApplicationByUserId(user.id);
    if (application == null) return Test.fail();
    expect(application.type).toBe("ORGANIZATION");
    expect(application.files.length).toBe(2);
    expect(application.appliedCountry).toBe("SG");

    const organization = await Organization.lib.getByUserId(user.id);

    if (organization == null) return Test.fail();

    expect(organization.name).toBe(Test.organization.organizationData.name);
    expect(organization.members.length).toBe(1);
    expect(organization.members[0].userId).toContain(user.id);
    expect(organization.applicationId).toBe(application.id);

    try {
      const files = application.files;
      files.forEach((file) => {
        expect(["IDENTIFICATION", "CERTIFICATE"]).toContain(file.fileType);
        const fileType = File.ReadWrite.convertStrToFileType(file.fileType);
        if (fileType == null) throw new Error("File type is not valid");
        const filePath = File.ReadWrite.getFilePath(fileType);
        if (filePath == null) throw new Error("File type doesn't have a path");
        if (fs.existsSync(`${filePath.path}${files[0].name}`)) {
          //file exists
        }
      });
    } catch (err: any) {
      throw new Error(err);
    }
  });

  it("Invalid country code should return error", async () => {
    const { jwt, user } = await Test.createUser({
      ...Test.defaultUser,
      email: "invalid_country_code@example.com",
    });
    const response = await postUploadOrganizationApi(
      {
        countryCode: "SGP",
        ...Test.organization,
        members: [...Test.organization.members, user.email],
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyBusinessCertificate,
      jwt
    );

    expect(response.body.error.code).toBe("INVALID_COUNTRY");
  });

  it("Only user can submit application", async () => {
    const { jwt, user } = await Test.createUser({
      ...Test.defaultUser,
      email: "organization_role@example.com",
    });

    await Test.db
      .update({ role: "ORGANIZATION_MANAGER" })
      .from("users")
      .where({ id: user.id });

    const response = await postUploadOrganizationApi(
      {
        countryCode: "SG",
        ...Test.organization,
        members: [...Test.organization.members, user.email],
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyBusinessCertificate,
      jwt
    );

    expect(response.body.error.code).toBe("DUPLICATE_APPLICATION");
  });
});
