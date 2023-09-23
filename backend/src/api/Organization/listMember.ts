import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import JWT, { JWTError } from "../../libs/JWT";
import Organization, { MemberData } from "../../libs/Organization";

const errors = {
  ...JWT.lib.errors,
  ORGANIZATION_NOT_FOUND: "You do not have a organization.",
};

type ResponseData = {
  members: MemberData[];
};

export default async function ListMember(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const organization = await Organization.lib.getByUserId(jwtPayload.userId);

  if (organization == null)
    return StandardResponse.fail(response, errors, "ORGANIZATION_NOT_FOUND");

  return StandardResponse.success<ResponseData>(response, {
    members: organization.members,
  });
}
