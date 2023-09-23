import * as JD from "decoders";

type Status = Readonly<"PENDING" | "APPROVED" | "REJECTED">;
const status: Status[] = ["PENDING", "APPROVED", "REJECTED"];

type ApplicationType = Readonly<"BENEFICIARY" | "MERCHANT" | "ORGANIZATION">;
const applicationType: ApplicationType[] = [
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
type AddressType = Readonly<"PERSONAL" | "BUSINESS">;
const addressType: AddressType[] = ["PERSONAL", "BUSINESS"];
type OrganizationSchema = Readonly<{
  id: string;
  name: string;
  applicationId: string;
}>;

export type Member = Readonly<{
  id: string;
  userId: string;
  email: string;
  name: string;
}>;

type MerchantSchema = Readonly<{
  id: string;
  name: string;
  applicationId: string;
}>;

type AddressSchema = Readonly<{
  id: string;
  address: string;
  applicationId: string;
  type: AddressType;
}>;

export type ApplicationOverview = Readonly<{
  id: string;
  status: Status;
  type: ApplicationType;
  createdAt: string;
  appliedCountry: string;
}>;

export type Application = Readonly<{
  id: string;
  status: Status;
  type: ApplicationType;
  userId: string;
  appliedCountry: string;
  applicantName: string;
  createdAt: string;
}>;

export type ApplicationDetail = {
  application: Application;
  files: { name: string; url: string; fileType: FileType }[];
  personalAddress: AddressSchema;
  organization:
    | (OrganizationSchema & { members: Member[]; addresses: AddressSchema[] })
    | null;
  merchant: (MerchantSchema & { addresses: AddressSchema[] }) | null;
};

function decodeOverview(data: any): {
  applications: ApplicationOverview[];
  totalApplications: number;
} {
  return JD.object({
    applications: JD.array(
      JD.object({
        id: JD.string,
        status: JD.oneOf(status),
        type: JD.oneOf(applicationType),
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
        appliedCountry: JD.string,
      })
    ),
    totalApplications: JD.number,
  }).verify(data);
}

function decodeApplication(data: any): ApplicationDetail {
  return JD.object({
    application: JD.object({
      id: JD.string,
      status: JD.oneOf(status),
      type: JD.oneOf(applicationType),
      userId: JD.string,
      createdAt: JD.number.transform((epoch) =>
        new Date(epoch).toLocaleString()
      ),
      appliedCountry: JD.string,
      applicantName: JD.string,
    }),
    files: JD.array(
      JD.object({
        name: JD.string,
        url: JD.string,
        fileType: JD.oneOf(fileType),
      })
    ),
    personalAddress: JD.object({
      id: JD.string,
      address: JD.string,
      applicationId: JD.string,
      type: JD.oneOf(addressType),
    }),
    organization: JD.nullable(
      JD.object({
        id: JD.string,
        name: JD.string,
        applicationId: JD.string,
        members: JD.array(
          JD.object({
            id: JD.string,
            userId: JD.string,
            email: JD.string,
            name: JD.string,
          })
        ),
        addresses: JD.array(
          JD.object({
            id: JD.string,
            address: JD.string,
            applicationId: JD.string,
            type: JD.oneOf(addressType),
          })
        ),
      })
    ),
    merchant: JD.nullable(
      JD.object({
        id: JD.string,
        name: JD.string,
        applicationId: JD.string,
        addresses: JD.array(
          JD.object({
            id: JD.string,
            address: JD.string,
            applicationId: JD.string,
            type: JD.oneOf(addressType),
          })
        ),
      })
    ),
  }).verify(data);
}

export default { decodeOverview, decodeApplication };
