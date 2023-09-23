import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import File from "../../libs/File";
import Application from "../../libs/Application";
import Encryption from "../../libs/Encryption";

const errors = {
  ...Application.lib.errors,
  INVALID_FILE: "Unable to find the file requested.",
  DECRYPTION_ERROR: "Unable to decrypt file content.",
};

export default async function ViewFile(
  request: express.Request,
  response: express.Response
): Promise<void | express.Response> {
  const applicationPayload = await Application.lib.getDocumentInfo(request);

  if (applicationPayload instanceof Application.lib.DocumentError)
    return StandardResponse.fail(response, errors, applicationPayload.name);

  const file = applicationPayload.application.files.filter(
    ({ id }) => id === applicationPayload.payload.fileId
  );
  if (file.length === 0)
    return StandardResponse.fail(response, errors, "INVALID_FILE");

  const buffer = File.ReadWrite.readFile(file[0].name, file[0].fileType);
  if (buffer == null)
    return StandardResponse.fail(response, errors, "INVALID_FILE");
  const decryptedBuffer = Encryption.FileEncryption.decrypt(buffer);

  if (decryptedBuffer instanceof Error)
    return StandardResponse.fail(response, errors, "DECRYPTION_ERROR");

  return StandardResponse.bufferSuccess(response, decryptedBuffer);
}
