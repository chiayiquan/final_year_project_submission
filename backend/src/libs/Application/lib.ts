import Application, {
  ApplicationType,
  FileType,
  Application as ApplicationSchema,
  Status,
  ApplicationOverview,
} from "./model";
import db, { generateID } from "../../db";
import User, { Schema as UserSchema, Role } from "../User";
import { Knex } from "knex";
import Organization from "../Organization";
import express from "express";
import * as JD from "decoders";
import env from "../../env";
import jwt from "jsonwebtoken";
import JWT, { JWTError } from "../JWT";

async function insertApplication(
  applicationData: {
    type: ApplicationType;
    userId: string;
    appliedCountry: string;
    applicantName: string;
  },
  applicationFiles: { name: string; fileType: FileType }[],
  txn: Knex<any, unknown[]> | Knex.Transaction = db
): Promise<string | null> {
  try {
    const applicationId = await Application.insertApplication(
      {
        ...applicationData,
        id: generateID(),
        status: "PENDING",
        createdAt: Date.now(),
      },
      txn
    );

    const filesToInsert = applicationFiles.map((files) => ({
      ...files,
      id: generateID(),
      applicationId,
    }));
    await Application.insertApplicationFile(filesToInsert, txn);

    return applicationId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getApplicationByUserId(
  userId: string
): Promise<ApplicationSchema | null> {
  try {
    return (await Application.getByApplicationByUserId(userId))[0];
  } catch (error) {
    return null;
  }
}

async function getApplicationById(
  id: string
): Promise<ApplicationSchema | null> {
  try {
    return (await Application.getByApplicationId(id))[0];
  } catch (error) {
    return null;
  }
}

function convertToFileType(fileType: string): FileType {
  switch (fileType) {
    case "IDENTIFICATION":
      return "IDENTIFICATION";
    case "LICENSE":
      return "LICENSE";
    case "CERTIFICATE":
      return "CERTIFICATE";
    default:
      return "INCOME";
  }
}

async function checkSufficientPermission(
  application: ApplicationSchema,
  user: UserSchema
): Promise<boolean> {
  const isOrganizationPermitted = await checkOrganizationPermitted(
    application,
    user
  );

  switch (application.type) {
    case "ORGANIZATION":
      return user.role === "ADMIN";
    case "MERCHANT":
      return (
        user.role === "ADMIN" ||
        (user.role === "ORGANIZATION_MANAGER" && isOrganizationPermitted) ||
        (user.role === "ORGANIZATION_MEMBER" && isOrganizationPermitted)
      );
    case "BENEFICIARY":
      return (
        user.role === "ADMIN" ||
        (user.role === "ORGANIZATION_MANAGER" && isOrganizationPermitted) ||
        (user.role === "ORGANIZATION_MEMBER" && isOrganizationPermitted)
      );
    default:
      return false;
  }
}

async function checkOrganizationPermitted(
  application: ApplicationSchema,
  user: UserSchema
): Promise<boolean> {
  if (
    user.role !== "ORGANIZATION_MANAGER" &&
    user.role !== "ORGANIZATION_MEMBER"
  )
    return false;
  try {
    const organizationDetail = await Organization.lib.getByUserId(user.id);
    if (organizationDetail == null) return false;
    const organizationApplication = (
      await Application.getByApplicationId(organizationDetail.applicationId)
    )[0];

    return (
      organizationApplication.status === "APPROVED" &&
      organizationApplication.appliedCountry === application.appliedCountry
    );
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function updateApplicationStatus(
  applicationId: string,
  status: Status,
  txn: Knex<any, unknown[]> | Knex.Transaction = db
): Promise<boolean> {
  try {
    await Application.updateApplication({ status }, { id: applicationId }, txn);

    return true;
  } catch (error) {
    return false;
  }
}

async function listApplications(
  page: number = 0,
  limit: number = 10,
  applicationType: ApplicationType[],
  countryCode?: string
): Promise<ApplicationOverview[]> {
  return Application.listApplicationWithPagination(
    page * limit,
    limit,
    countryCode == undefined ? {} : { appliedCountry: countryCode },
    applicationType
  );
}
async function listPersonalApplications(
  page: number = 0,
  limit: number = 10,
  userId: string
): Promise<ApplicationOverview[]> {
  return Application.listApplicationWithPagination(
    page * limit,
    limit,
    { userId },
    ["BENEFICIARY", "MERCHANT", "ORGANIZATION"]
  );
}

async function getTotalApplications(
  applicationType: ApplicationType[],
  countryCode?: string
): Promise<number> {
  return Application.count(
    countryCode == undefined ? {} : { appliedCountry: countryCode },
    applicationType
  );
}

async function getTotalPersonalApplications(userId: string): Promise<number> {
  return Application.count({ userId }, [
    "BENEFICIARY",
    "MERCHANT",
    "ORGANIZATION",
  ]);
}

// url encryption

const { DOCUMENT_URL_SECRET } = env;

export type DocumentUrlPayload = Readonly<{
  fileId: string;
  jwtToken: string;
  applicationId: string;
}>;

function decodePayload(data: any): DocumentUrlPayload {
  return JD.object({
    fileId: JD.string,
    jwtToken: JD.string,
    applicationId: JD.string,
  }).verify(data);
}

class DocumentError extends Error {
  name: keyof typeof errors;
  constructor(code: keyof typeof errors) {
    super(errors[code]);
    this.name = code;
  }
}

const errors = {
  ...JWT.lib.errors,
  INVALID_FILE: "Invalid file id provided.",
  INVALID_APPLICATION: "Invalid application id provided.",
  INSUFFICIENT_PERMISSION: "Insufficient permission to view this file.",
  INVALID_USER: "User does not exist.",
};

async function issue(
  fileId: string,
  jwtToken: string,
  applicationId: string
): Promise<string> {
  return jwt.sign({ jwtToken, fileId, applicationId }, DOCUMENT_URL_SECRET);
}

async function getDocumentInfo(
  request: express.Request
): Promise<
  | { payload: DocumentUrlPayload; application: ApplicationSchema }
  | DocumentError
> {
  const documentPayload = verifyToken(request.params.id);
  if (documentPayload instanceof DocumentError) return documentPayload;

  const jwtPayload = await JWT.lib.verify(documentPayload.jwtToken);
  if (jwtPayload instanceof JWTError) return new DocumentError("INVALID_JWT");

  const [application, user] = await Promise.all([
    getApplicationById(documentPayload.applicationId),
    User.lib.getUserById(jwtPayload.userId),
  ]);
  if (application == null) return new DocumentError("INVALID_APPLICATION");

  if (user == null) return new DocumentError("INVALID_USER");

  const hasPermission =
    (await checkSufficientPermission(application, user)) ||
    application.userId === user.id;
  if (hasPermission === false)
    return new DocumentError("INSUFFICIENT_PERMISSION");
  return { payload: documentPayload, application };
}

function verifyToken(token: string): DocumentUrlPayload | DocumentError {
  try {
    const payload = jwt.verify(token, DOCUMENT_URL_SECRET);
    return decodePayload(payload);
  } catch (error) {
    return new DocumentError("INVALID_APPLICATION");
  }
}

export default {
  insertApplication,
  convertToFileType,
  getApplicationByUserId,
  getApplicationById,
  checkSufficientPermission,
  updateApplicationStatus,
  issue,
  getDocumentInfo,
  errors,
  DocumentError,
  listApplications,
  getTotalApplications,
  listPersonalApplications,
  getTotalPersonalApplications,
};
