import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";
import path from "path";
import Application from "../../../src/libs/Application";
import fs from "fs";
import File from "../../../src/libs/File";
import Merchant from "../../../src/libs/Merchant";

const postUploadMerchantApi = async (
  data: { [key: string]: string | null | {} },
  responseStatus: number,
  identificationFile: string,
  licenseFile: string,
  jwt: string
): Promise<request.Test> => {
  return request(app)
    .post("/application/merchant")
    .set("Authorization", `Bearer ${jwt}`)
    .set("Accept", "application/json")
    .field("data", JSON.stringify(data))
    .attach("LICENSE", licenseFile)
    .attach("IDENTIFICATION", identificationFile)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const dummyIdFile = path.resolve(
  __dirname,
  "../../sampleFile/identification.pdf"
);

const dummyLicenseFile = path.resolve(
  __dirname,
  "../../sampleFile/license.pdf"
);

jest.setTimeout(50000);

describe("Test for UploadMerchant", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should check for valid jwt", async () => {
    const response = await postUploadMerchantApi(
      {
        countryCode: "SG",
        ...Test.merchant,
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyLicenseFile,
      "invalid-jwt"
    );
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should upload identification file and f&b license", async () => {
    const { jwt, user } = await Test.createUser();
    await postUploadMerchantApi(
      {
        countryCode: "SG",
        ...Test.merchant,
        personalInformation: Test.defaultPersonalInformation,
      },
      200,
      dummyIdFile,
      dummyLicenseFile,
      jwt
    );

    const application = await Application.lib.getApplicationByUserId(user.id);
    if (application == null) return Test.fail();
    expect(application.type).toBe("MERCHANT");
    expect(application.files.length).toBe(2);
    expect(application.appliedCountry).toBe("SG");

    const merchant = await Merchant.lib.getByApplicationId(application.id);
    expect(merchant?.name).toBe(Test.merchant.merchantData.name);

    try {
      const files = application.files;
      files.forEach((file) => {
        expect(["IDENTIFICATION", "LICENSE"]).toContain(file.fileType);
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
    const response = await postUploadMerchantApi(
      {
        countryCode: "SGP",
        ...Test.merchant,
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyLicenseFile,
      jwt
    );

    expect(response.body.error.code).toBe("INVALID_COUNTRY");
  });

  it("Only user can submit application", async () => {
    const { jwt, user } = await Test.createUser({
      ...Test.defaultUser,
      email: "merchant_role@example.com",
    });

    await Test.db
      .update({ role: "MERCHANT" })
      .from("users")
      .where({ id: user.id });

    const response = await postUploadMerchantApi(
      {
        countryCode: "SG",
        ...Test.merchant,
        personalInformation: Test.defaultPersonalInformation,
      },
      400,
      dummyIdFile,
      dummyLicenseFile,
      jwt
    );

    expect(response.body.error.code).toBe("DUPLICATE_APPLICATION");
  });
});
