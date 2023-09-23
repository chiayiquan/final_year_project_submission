import crypto from "crypto";
import env from "../../env";

const algorithm = "aes-256-cbc";

function encrypt(
  data: string | Buffer,
  password: string = env.FILE_SECRET
): Buffer {
  const iv = crypto.randomBytes(16);
  const key = getCipherKey(password);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encryptedData = Buffer.concat([
    iv,
    cipher.update(data),
    cipher.final(),
  ]);
  return encryptedData;
}

function decrypt(
  data: Buffer,
  password: string = env.FILE_SECRET
): Buffer | Error {
  // Get the iv: the first 16 bytes
  const iv = data.subarray(0, 16);
  const key = getCipherKey(password);
  // Get the rest
  const encryptedFileContent = data.subarray(16, data.length);
  try {
    // Create a decipher
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    // Actually decrypt it
    const result = Buffer.concat([
      decipher.update(encryptedFileContent),
      decipher.final(),
    ]);
    return result;
  } catch (error) {
    return new Error("Incorrect password provided");
  }
}

function getCipherKey(password: string): Buffer {
  return crypto.createHash("sha256").update(password).digest();
}

export default { encrypt, decrypt };
