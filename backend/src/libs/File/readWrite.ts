import fs from "fs";
import env from "../../env";
import path from "path";

export type FileType = Readonly<
  "WALLET" | "IDENTIFICATION" | "INCOME" | "LICENSE" | "CERTIFICATE"
>;
function storeEncryptedContentToFile(
  fileName: string,
  encryptedContent: Buffer,
  type: FileType
): boolean {
  try {
    const file = getFilePath(type);
    if (file == null) return false;
    const filePath = path.join(file.path);

    fs.mkdirSync(filePath, { recursive: true });
    const stream = fs.createWriteStream(`${file.path}${fileName}${file.ext}`);
    stream.write(encryptedContent);
    stream.end();
    return true;
  } catch (error) {
    return false;
  }
}

function readFile(fileName: string, type: FileType): Buffer | null {
  try {
    const file = getFilePath(type);
    if (file == null) return null;
    return fs.readFileSync(`${file.path}${fileName}${file.ext}`);
  } catch (error) {
    return null;
  }
}

function getFilePath(type: FileType): { path: string; ext: string } | null {
  switch (type) {
    case "WALLET":
      return { path: `${env.STORAGE_PATH}/wallet/`, ext: ".txt.enc" };
    case "IDENTIFICATION":
      return { path: `${env.STORAGE_PATH}/identification/`, ext: "" };
    case "INCOME":
      return { path: `${env.STORAGE_PATH}/income/`, ext: "" };
    case "LICENSE":
      return { path: `${env.STORAGE_PATH}/license/`, ext: "" };
    case "CERTIFICATE":
      return { path: `${env.STORAGE_PATH}/certificate/`, ext: "" };
    default:
      return null;
  }
}

function convertStrToFileType(type: string): FileType | null {
  switch (type) {
    case "WALLET":
      return "WALLET";
    case "IDENTIFICATION":
      return "IDENTIFICATION";
    case "INCOME":
      return "INCOME";
    case "LICENSE":
      return "LICENSE";
    case "CERTIFICATE":
      return "CERTIFICATE";
    default:
      return null;
  }
}

export default {
  storeEncryptedContentToFile,
  readFile,
  convertStrToFileType,
  getFilePath,
};
