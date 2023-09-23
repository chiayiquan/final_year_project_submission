import * as JD from "decoders";

export type ListSchema = Readonly<{
  countryCode: string;
  countryName: string;
  address: string | null;
}>;

export type CountrySchema = Readonly<{
  code: string;
  name: string;
}>;
type AddressType = Readonly<"PERSONAL" | "BUSINESS">;
const addressType: AddressType[] = ["PERSONAL", "BUSINESS"];

type Address = Readonly<{
  id: string;
  address: string;
  applicationId: string;
  type: AddressType;
}>;
export type Detail = Readonly<{
  totalVoucherIssued: number;
  totalVoucherUsed: number;
  unusedVoucherAmount: number;
  mealVoucherPrice: number;
  usdcBalance: number;
  managementFees: number;
  organizations: {
    id: string;
    name: string;
    applicationId: string;
    addresses: Address[];
  }[];
  merchants: {
    id: string;
    name: string;
    applicationId: string;
    addresses: Address[];
  }[];
  contractId: string;
}>;

function decodeList(data: any[]): { countries: ListSchema[] } {
  return JD.object({
    countries: JD.array(
      JD.object({
        countryCode: JD.string,
        countryName: JD.string,
        address: JD.nullable(JD.string),
      })
    ),
  }).verify(data);
}

function decodeCountries(data: any[]): { countries: CountrySchema[] } {
  return JD.object({
    countries: JD.array(
      JD.object({
        code: JD.string,
        name: JD.string,
      })
    ),
  }).verify(data);
}

function decodeDetail(data: any[]): { detail: Detail } {
  return JD.object({
    detail: JD.object({
      totalVoucherIssued: JD.number,
      totalVoucherUsed: JD.number,
      unusedVoucherAmount: JD.number,
      mealVoucherPrice: JD.number,
      usdcBalance: JD.number,
      managementFees: JD.number,
      organizations: JD.array(
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
      merchants: JD.array(
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
      contractId: JD.string,
    }),
  }).verify(data);
}

export { decodeList, decodeDetail, decodeCountries };
