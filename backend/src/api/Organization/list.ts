import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Organization, { OrganizationSchema } from "../../libs/Organization";

type ResponseData = {
  organizations: OrganizationSchema[];
  totalOrganizations: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function List(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const { page, limit } = decodeParams(request.query);

  const [organizations, totalOrganizations] = await Promise.all([
    Organization.lib.getOrganizationWithPagination(page, limit),
    Organization.lib.getTotalOrganizations(),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    organizations,
    totalOrganizations,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    page: JD.optional(JD.string).transform(
      (strNum) => Number(strNum) || undefined
    ),
    limit: JD.optional(JD.string).transform(
      (strNum) => Number(strNum) || undefined
    ),
  }).verify(data);
}
