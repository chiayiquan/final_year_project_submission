import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Application, {
  ApplicationOverview,
  ApplicationType,
  applicationType,
} from "../../libs/Application";
import Organization from "../../libs/Organization";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";

const errors = {
  ...JWT.lib.errors,
  INVALID_APPLICATION: "Application does not exist.",
  INSUFFICIENT_PERMISSION:
    "You do not have the permission to view applications.",
  UNKNOWN_ERROR: "An unexpected error has occurred, please try again later.",
};

type ResponseData = {
  applications: ApplicationOverview[];
  totalApplications: number;
};

type Params = {
  page?: number;
  limit?: number;
  countryCode?: string;
  filterType?: string;
};

export default async function List(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const currentUser = await User.lib.getUserById(jwtPayload.userId);

  if (currentUser == null)
    return StandardResponse.fail(response, errors, "UNKNOWN_ERROR");

  let application;
  if (currentUser.role !== "ADMIN") {
    const organization = await Organization.lib.getByUserId(currentUser.id);
    if (organization == null)
      return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");

    application = await Application.lib.getApplicationById(
      organization.applicationId
    );

    if (application == null)
      return StandardResponse.fail(response, errors, "INVALID_APPLICATION");

    if (
      application.status !== "APPROVED" ||
      application.type !== "ORGANIZATION"
    )
      return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");
  }

  const { page, limit, countryCode, filterType } = decodeParams(request.query);

  const countryToGet =
    application == null ? countryCode : application.appliedCountry;

  const organizationFilter: ApplicationType[] =
    filterType === "BENEFICIARY" || filterType === "MERCHANT"
      ? [filterType]
      : ["BENEFICIARY", "MERCHANT"];

  const adminFilter: ApplicationType[] =
    filterType && applicationType.some((type) => type === filterType)
      ? [filterType as ApplicationType]
      : ["BENEFICIARY", "MERCHANT", "ORGANIZATION"];

  const applicationTypeToRetrieve =
    currentUser.role === "ADMIN" ? adminFilter : organizationFilter;

  const [applications, totalApplications] = await Promise.all([
    Application.lib.listApplications(
      page,
      limit,
      applicationTypeToRetrieve,
      countryToGet
    ),
    Application.lib.getTotalApplications(
      applicationTypeToRetrieve,
      countryToGet
    ),
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
    countryCode: JD.optional(JD.string).transform((str) =>
      str === "undefined" ? undefined : str?.toUpperCase()
    ),
    filterType: JD.optional(JD.string).transform((str) => str?.toUpperCase()),
  }).verify(data);
}
