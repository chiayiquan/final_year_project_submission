import db from "../../db";
import * as JD from "decoders";
import { Knex } from "knex";

export type AddressType = Readonly<"PERSONAL" | "BUSINESS">;
const addressType: AddressType[] = ["PERSONAL", "BUSINESS"];

export type Schema = Readonly<{
  id: string;
  address: string;
  applicationId: string;
  type: AddressType;
}>;

async function insert(
  data: Schema[],
  txn: Knex<any, unknown[]> | Knex.Transaction
) {
  return txn.insert(data).into("addresses").returning("*");
}

async function get(whereClause: Partial<Schema>): Promise<Schema[]> {
  return db.select("*").from("addresses").where(whereClause).then(decode);
}

function decode(data: any): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      address: JD.string,
      applicationId: JD.string,
      type: JD.oneOf(addressType),
    })
  ).verify(data);
}

export default { insert, decode, addressType, get };
