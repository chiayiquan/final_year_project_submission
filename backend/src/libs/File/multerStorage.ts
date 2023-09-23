import multer from "multer";
import fs from "fs";
import { generateID } from "../../db";
import env from "../../env";
import path from "path";

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let destinationPath = env.STORAGE_PATH;
    if (file.fieldname === "IDENTIFICATION")
      destinationPath = `${destinationPath}identification`;
    else if (file.fieldname === "INCOME")
      destinationPath = `${destinationPath}income`;
    else if (file.fieldname === "LICENSE")
      destinationPath = `${destinationPath}license`;
    else if (file.fieldname === "CERTIFICATE")
      destinationPath = `${destinationPath}certificate`;

    fs.mkdirSync(destinationPath, { recursive: true });
    cb(null, destinationPath);
  },
  filename: (_req, file, cb) => {
    cb(null, `${generateID()}${path.extname(file.originalname)}`);
  },
});

const errors = {
  WRONG_FILE_FORMAT: "The file format uploaded are not supported.",
  INVALID_COUNTRY: "The country you are applying are not supported.",
  UNEXPECTED_ERROR: "Unexpected error have occurred, please try again.",
  FILE_STORAGE_ERROR: "Unable to store file into storage, please try again.",
  DUPLICATE_APPLICATION:
    "Unable to submit new application due to accepted application.",
};

class UploadErrors extends Error {
  name: keyof typeof errors;
  constructor(code: keyof typeof errors) {
    super(errors[code]);
    this.name = code;
  }
}

export default { storage, errors, UploadErrors };
