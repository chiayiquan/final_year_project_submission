import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import Application, {
  ApplicationSchema,
  FileType,
} from "../../libs/Application";
import env from "../../env";
import Address, { AddressSchema } from "../../libs/Address";
import Organization, { Schema } from "../../libs/Organization";
import Merchant, { MerchantData } from "../../libs/Merchant";

const errors = {
  ...JWT.lib.errors,
  INSUFFICIENT_PERMISSION:
    "You do not have the permission to view this application.",
  INVALID_APPLICATION: "Application does not exist.",
  INVALID_USER: "User does not exist.",
  MISSING_ADDRESS: "Address is missing.",
};

type ResponseData = {
  application: ApplicationSchema;
  files: { name: string; url: string; fileType: FileType }[];
  personalAddress: AddressSchema;
  organization: Schema | null;
  merchant: MerchantData | null;
};

type Params = {
  id: string;
};

export default async function View(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { id } = decodeParams(request.params);

  const application = await Application.lib.getApplicationById(id);

  if (application == null)
    return StandardResponse.fail(response, errors, "INVALID_APPLICATION");

  const user = await User.lib.getUserById(jwtPayload.userId);

  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const havePermission = await Application.lib.checkSufficientPermission(
    application,
    user
  );

  if (havePermission === false && user.id !== application.userId)
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const jwtToken = JWT.lib.getJWTFromHeader(request);

  const fileUrl: { name: string; url: string; fileType: FileType }[] =
    await Promise.all(
      application.files.map(async (file) => ({
        name: file.name,
        url: `${env.API_URL}/view-file/${await Application.lib.issue(
          file.id,
          jwtToken,
          id
        )}`,
        fileType: file.fileType,
      }))
    );

  const personalAddress = await Address.lib.getAddressById(
    application.id,
    "PERSONAL"
  );

  if (personalAddress == null)
    return StandardResponse.fail(response, errors, "MISSING_ADDRESS");

  const organization =
    (await Organization.lib.getOrganizationWithApplicationId(application.id)) ||
    null;

  const merchant =
    (await Merchant.lib.getByApplicationId(application.id)) || null;

  return StandardResponse.success<ResponseData>(response, {
    application,
    files: fileUrl,
    personalAddress,
    organization,
    merchant,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    id: JD.string,
  }).verify(data);
}
