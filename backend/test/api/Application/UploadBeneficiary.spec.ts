import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import path from "path";
import Application from "../../../src/libs/Application";
import fs from "fs";
import File from "../../../src/libs/File";

const postUploadbeneficiaryApi = async (
  data: { [key: string]: string | null | {} },
  responseStatus: number,
  identificationFile: string,
  incomeFile: string,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/application/beneficiary")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .field("data", JSON.stringify(data))
    .attach("INCOME", incomeFile)
    .attach("IDENTIFICATION", identificationFile)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const dummyIdFile = path.resolve(
  __dirname,
  "../../sampleFile/identification.pdf"
);

const dummyIncomeFile = path.resolve(
  __dirname,
  "../../sampleFile/incomeStatement.pdf"
);

jest.setTimeout(50000);

describe("Test for Uploadbeneficiary", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await postUploadbeneficiaryApi(
      {
        countryCode: "SG",
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyIncomeFile,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should upload identification file and annual income statement", async () => {
    const { jwt, user } = await Test.createUser();
    await postUploadbeneficiaryApi(
      {
        countryCode: "SG",
        personalInformation: Test.defaultPersonalInformation,
      },
      200,
      dummyIdFile,
      dummyIncomeFile,
      jwt
    );

    const application = await Application.lib.getApplicationByUserId(user.id);
    if (application == null) return Test.fail();
    expect(application.type).toBe("BENEFICIARY");
    expect(application.files.length).toBe(2);
    expect(application.appliedCountry).toBe("SG");

    try {
      const files = application.files;
      files.forEach((file) => {
        expect(["IDENTIFICATION", "INCOME"]).toContain(file.fileType);
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
    const { jwt } = await Test.createUser({
      ...Test.defaultUser,
      email: "invalid_country_code@example.com",
    });
    const response = await postUploadbeneficiaryApi(
      {
        countryCode: "SGP",
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyIncomeFile,
      jwt
    );

    expect(response.body.error.code).toBe("INVALID_COUNTRY");
  });

  it("Only user can submit application", async () => {
    const { jwt, user } = await Test.createUser({
      ...Test.defaultUser,
      email: "beneficiary_role@example.com",
    });

    try {
      await Test.db
        .update({ role: "BENEFICIARY" })
        .from("users")
        .where({ id: user.id });
    } catch (error) {
      console.log(error);
    }

    const response = await postUploadbeneficiaryApi(
      {
        countryCode: "SG",
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyIncomeFile,
      jwt
    );

    expect(response.body.error.code).toBe("DUPLICATE_APPLICATION");
  });
});
