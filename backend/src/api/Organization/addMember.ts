import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import Organization from "../../libs/Organization";
import User from "../../libs/User";

const errors = {
  ...JWT.lib.errors,
  ORGANIZATION_NOT_FOUND: "You do not have a organization.",
  INVALID_USER: "User does not exist.",
  INSUFFICIENT_PERMISSION: "You do not have permission to add new member.",
  INSERTION_ERROR: "Unable to add new member, please try again later.",
};

type ResponseData = {
  message: string;
};

type Params = {
  emails: string[];
};

export default async function AddMember(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const currentUser = await User.lib.getUserById(jwtPayload.userId);

  if (currentUser == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  if (currentUser.role !== "ORGANIZATION_MANAGER")
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

  const { emails } = decodeParams(request.body);

  const userIds = await User.lib.getUserIds(emails);

  if (userIds.length != emails.length)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const organization = await Organization.lib.getByUserId(jwtPayload.userId);

  if (organization == null)
    return StandardResponse.fail(response, errors, "ORGANIZATION_NOT_FOUND");

  const result = await Organization.lib.addNewMember(userIds, organization.id);

  if (result === false)
    return StandardResponse.fail(response, errors, "INSERTION_ERROR");

  return StandardResponse.success<ResponseData>(response, {
    message: "Members are added successfully.",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    emails: JD.array(JD.string.transform((str) => str.trim().toLowerCase())),
  }).verify(data);
}
