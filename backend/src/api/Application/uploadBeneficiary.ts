import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import multer, { FileFilterCallback } from "multer";
import JWT, { JWTError, Payload as JWTPayload } from "../../libs/JWT";
import File from "../../libs/File";
import { checkCountryExist } from "../../libs/Country";
import Application from "../../libs/Application";
import Encryption from "../../libs/Encryption";
import User from "../../libs/User";
import Address from "../../libs/Address";
import db from "../../db";

const errors = {
  ...JWT.lib.errors,
  ...File.MulterStorage.errors,
  INVALID_USER: "User does not exist.",
  EMPTY_NAME: "Name cannot be empty.",
  EMPTY_ADDRESS: "Address cannot be empty.",
};

type ResponseData = {
  message: string;
};

type Params = {
  personalInformation: {
    name: string;
    address: string;
  };
  countryCode: string;
};

export default async function UploadBeneficiary(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  const upload = multer({
    storage: File.MulterStorage.storage,
    fileFilter: (req, file, cb) => validate(jwtPayload, req, file, cb),
  }).fields([
    { name: "IDENTIFICATION", maxCount: 1 },
    { name: "INCOME", maxCount: 1 },
  ]);

  return new Promise((resolve, reject) => {
    upload(request, response, async (err: Error | string) => {
      if (err instanceof File.MulterStorage.UploadErrors) {
        return resolve(StandardResponse.fail(response, errors, err.name));
      }

      if (jwtPayload instanceof JWTError) {
        return resolve(
          StandardResponse.fail(response, errors, jwtPayload.name)
        );
      }

      const user = await User.lib.getUserById(jwtPayload.userId);

      if (user == null)
        return StandardResponse.fail(response, errors, "INVALID_USER");

      if (user.role !== "USER") {
        return resolve(
          StandardResponse.fail(response, errors, "DUPLICATE_APPLICATION")
        );
      }

      const { countryCode, personalInformation } = decodeParams(
        JSON.parse(request.body.data)
      );

      if (personalInformation.address.length === 0)
        return resolve(
          StandardResponse.fail(response, errors, "EMPTY_ADDRESS")
        );

      if (personalInformation.name.length === 0)
        return resolve(StandardResponse.fail(response, errors, "EMPTY_NAME"));

      const files = request.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const saveResult = await Promise.all(
        Object.keys(files).map((key) => {
          const fileType = File.ReadWrite.convertStrToFileType(
            files[key][0].fieldname
          );
          const fileName = files[key][0].filename;
          if (fileType == null) return false;
          const fileContent = File.ReadWrite.readFile(fileName, fileType);
          if (fileContent == null) return false;
          const encryptedContent =
            Encryption.FileEncryption.encrypt(fileContent);
          return File.ReadWrite.storeEncryptedContentToFile(
            fileName,
            encryptedContent,
            fileType
          );
        })
      );

      if (saveResult.some((val) => val === false))
        return StandardResponse.fail(response, errors, "FILE_STORAGE_ERROR");

      const fileData = Object.keys(files).map((key: string) => ({
        name: files[key][0].filename,
        fileType: Application.lib.convertToFileType(key),
      }));

      await db.transaction(async (txn) => {
        const applicationId = await Application.lib.insertApplication(
          {
            type: "BENEFICIARY",
            userId: jwtPayload.userId,
            appliedCountry: countryCode,
            applicantName: personalInformation.name,
          },
          fileData
        );

        if (applicationId == null) {
          return resolve(
            StandardResponse.fail(response, errors, "UNEXPECTED_ERROR")
          );
        }

        await Address.lib.insertAddress(
          [personalInformation.address],
          applicationId,
          "PERSONAL",
          txn
        );
      });

      return resolve(
        StandardResponse.success<ResponseData>(response, {
          message: "Application submitted successfully.",
        })
      );
    });
  });
}

async function validate(
  jwtResult: JWTError | JWTPayload,
  req: express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): Promise<void> {
  try {
    if (jwtResult instanceof JWTError) {
      return cb(new JWTError(jwtResult.name));
    }

    // accept pdf file on backend
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new File.MulterStorage.UploadErrors("WRONG_FILE_FORMAT"));
    }

    const data = decodeParams(JSON.parse(req.body.data));

    const isValidCountry = await checkCountryExist(data.countryCode);

    if (isValidCountry === false) {
      return cb(new File.MulterStorage.UploadErrors("INVALID_COUNTRY"));
    }

    return cb(null, true);
  } catch (error) {
    console.log(error);
    return cb(new File.MulterStorage.UploadErrors("UNEXPECTED_ERROR"));
  }
}

function decodeParams(data: any): Params {
  return JD.object({
    countryCode: JD.string,
    personalInformation: JD.object({
      name: JD.string.transform((str) => str.trim()),
      address: JD.string.transform((str) => str.trim()),
    }),
  }).verify(data);
}
