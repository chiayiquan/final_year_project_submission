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
  NOT_IN_ORGANIZATION: "User not in organization.",
  DELETION_ERROR: "Unable to remove member, please try again later.",
  OWNER_ERROR: "Unable to remove owners from the organization.",
};

type ResponseData = {
  message: string;
};

type Params = {
  emails: string[];
};

export default async function RemoveMember(
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

  const members = organization.members.map(({ userId }) => userId);
  const isMember = userIds.every((userId) => members.includes(userId));

  if (isMember === false)
    return StandardResponse.fail(response, errors, "NOT_IN_ORGANIZATION");

  const isOwner = userIds.some((userId) => userId === currentUser.id);

  if (isOwner) return StandardResponse.fail(response, errors, "OWNER_ERROR");

  const result = await Organization.lib.removeMember(userIds, organization.id);

  if (result === false)
    return StandardResponse.fail(response, errors, "DELETION_ERROR");

  return StandardResponse.success<ResponseData>(response, {
    message: "Members are removed successfully.",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    emails: JD.array(JD.string.transform((str) => str.trim().toLowerCase())),
  }).verify(data);
}
