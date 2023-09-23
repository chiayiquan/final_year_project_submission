import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Application, { ApplicationOverview } from "../../libs/Application";
import JWT, { JWTError } from "../../libs/JWT";

const errors = {
  ...JWT.lib.errors,
  INVALID_APPLICATION: "Application does not exist.",
  UNKNOWN_ERROR: "An unexpected error has occurred, please try again later.",
};

type ResponseData = {
  applications: ApplicationOverview[];
  totalApplications: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function List(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { page, limit } = decodeParams(request.query);

  const [applications, totalApplications] = await Promise.all([
    Application.lib.listPersonalApplications(page, limit, jwtPayload.userId),
    Application.lib.getTotalPersonalApplications(jwtPayload.userId),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    applications,
    totalApplications,
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
