import db from "../../db";
import * as JD from "decoders";

type Schema = Readonly<{
  code: string;
  name: string;
}>;

async function get(whereClause: Partial<Schema>): Promise<Schema[]> {
  return db.select().from("countries").where(whereClause).then(decode);
}

async function getUnsupportedCountries(): Promise<Schema[]> {
  return db
    .select("*")
    .from("countries")
    .whereNotIn(
      "countries.code",
      db.select("contracts.countryCode").from("contracts")
    )
    .then(decode);
}

function decode(data: any[]): Schema[] {
  return JD.array(
    JD.object({
      code: JD.string,
      name: JD.string,
    })
  ).verify(data);
}

export { Schema, get, getUnsupportedCountries };
