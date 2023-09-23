import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Organization, { OrganizationSchema } from "../../libs/Organization";
import { AddressSchema } from "../../libs/Address";

const errors = {
  INVALID_ORGANIZATION: "The organization requested does not exist.",
};

type ResponseData = {
  organization: OrganizationSchema & {
    addresses: AddressSchema[];
  };
};

type Params = {
  id: string;
};

export default async function View(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const { id } = decodeParams(request.params);

  const organization = await Organization.lib.getById(id);

  if (organization == null)
    return StandardResponse.fail(response, errors, "INVALID_ORGANIZATION");

  const { members, ...rest } = organization;
  return StandardResponse.success<ResponseData>(response, {
    organization: rest,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    id: JD.string,
  }).verify(data);
}
