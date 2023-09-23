import * as JD from "decoders";
import db from "../../db";
import { Knex } from "knex";

export type Status = Readonly<"PENDING" | "APPROVED" | "REJECTED">;
const status: Status[] = ["PENDING", "APPROVED", "REJECTED"];

export type ApplicationType = Readonly<
  "BENEFICIARY" | "MERCHANT" | "ORGANIZATION"
>;
export const applicationType: ApplicationType[] = [
  "BENEFICIARY",
  "MERCHANT",
  "ORGANIZATION",
];

export type FileType = Readonly<
  "IDENTIFICATION" | "INCOME" | "LICENSE" | "CERTIFICATE"
>;
const fileType: FileType[] = [
  "IDENTIFICATION",
  "INCOME",
  "LICENSE",
  "CERTIFICATE",
];

export function convertToFileType(fileType: string): FileType {
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
export type ApplicationSchema = Readonly<{
  id: string;
  status: Status;
  type: ApplicationType;
  userId: string;
  appliedCountry: string;
  applicantName: string;
  createdAt: number;
}>;

export type ApplicationFileSchema = Readonly<{
  id: string;
  name: string;
  fileType: FileType;
  applicationId: string;
}>;

export type Application = ApplicationSchema & {
  files: ApplicationFileSchema[];
};

export type ApplicationOverview = Readonly<{
  id: string;
  status: Status;
  type: ApplicationType;
  createdAt: number;
  appliedCountry: string;
}>;

async function getByApplicationId(id: string): Promise<Application[]> {
  return db("applications")
    .innerJoin(
      "applicationFiles",
      "applications.id",
      "applicationFiles.applicationId"
    )
    .select([
      "applications.*",
      db.raw(`JSON_AGG(ROW_TO_JSON("applicationFiles".*)) as files`),
    ])
    .where("applications.id", id)
    .groupBy("applications.id")
    .then(decode);
}

async function getByApplicationByUserId(
  userId: string
): Promise<Application[]> {
  return db("applications")
    .innerJoin(
      "applicationFiles",
      "applications.id",
      "applicationFiles.applicationId"
    )
    .select([
      "applications.*",
      db.raw(`JSON_AGG(ROW_TO_JSON("applicationFiles".*)) as files`),
    ])
    .where("applications.userId", userId)
    .groupBy("applications.id")
    .then(decode);
}

async function insertApplication(
  data: ApplicationSchema,
  txn: Knex<any, unknown[]> | Knex.Transaction
): Promise<string> {
  return txn
    .insert(data)
    .into("applications")
    .returning("id")
    .then((rows) => decodeReturningId(rows)[0].id);
}

async function insertApplicationFile(
  data: ApplicationFileSchema[],
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  return txn.insert(data).into("applicationFiles").returning("*");
}

async function updateApplication(
  data: Partial<ApplicationSchema>,
  whereClause: Partial<ApplicationSchema>,
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  try {
    await txn.update(data).from("applications").where(whereClause);
    return true;
  } catch (error) {
    return false;
  }
}

async function listApplicationWithPagination(
  offset: number,
  limit: number,
  whereClause: Partial<ApplicationSchema>,
  applicationType: ApplicationType[]
): Promise<ApplicationOverview[]> {
  return db
    .select(["id", "status", "type", "createdAt", "appliedCountry"])
    .from("applications")
    .whereIn("type", applicationType)
    .andWhere(whereClause)
    .orderByRaw(`CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END`)
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .then(decodeOverview);
}

async function count(
  whereClause: Partial<ApplicationSchema>,
  applicationType: ApplicationType[]
): Promise<number> {
  return db
    .count("*")
    .from("applications")
    .whereIn("type", applicationType)
    .andWhere(whereClause)
    .then(decodeNumber);
}

function decode(data: any): Application[] {
  return JD.array(
    JD.object({
      id: JD.string,
      status: JD.oneOf(status),
      type: JD.oneOf(applicationType),
      userId: JD.string,
      createdAt: JD.number,
      appliedCountry: JD.string,
      applicantName: JD.string,
      files: JD.array(
        JD.object({
          id: JD.string,
          name: JD.string,
          fileType: JD.oneOf(fileType),
          applicationId: JD.string,
        })
      ),
    })
  ).verify(data);
}

function decodeOverview(data: any): ApplicationOverview[] {
  return JD.array(
    JD.object({
      id: JD.string,
      status: JD.oneOf(status),
      type: JD.oneOf(applicationType),
      createdAt: JD.number,
      appliedCountry: JD.string,
    })
  ).verify(data);
}

function decodeReturningId(data: any): { id: string }[] {
  return JD.array(JD.object({ id: JD.string })).verify(data);
}

function decodeNumber(data: any[]): number {
  const decodedData = JD.array(JD.object({ count: JD.number })).verify(data);
  return decodedData[0].count;
}

export default {
  insertApplication,
  insertApplicationFile,
  getByApplicationId,
  getByApplicationByUserId,
  updateApplication,
  listApplicationWithPagination,
  count,
};
