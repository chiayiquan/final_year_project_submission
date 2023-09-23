import db from "../../db";
import * as JD from "decoders";

export type Schema = Readonly<{
  id: string;
  userId: string;
  createdAt: number;
}>;

async function insert(data: Schema): Promise<Schema> {
  return db
    .into("sessions")
    .insert(data)
    .returning("*")
    .then((rows) => decode(rows)[0]);
}

async function get(whereClause: Partial<Schema>): Promise<Schema[]> {
  return db.select("*").from("sessions").where(whereClause).then(decode);
}

function decode(data: any): Schema[] {
  return JD.array(
    JD.object({
      id: JD.string,
      userId: JD.string,
      createdAt: JD.number,
    })
  ).verify(data);
}

export default { insert, get };
