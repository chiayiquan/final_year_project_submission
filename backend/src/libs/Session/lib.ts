import Session, { Schema } from "./model";
import { generateID } from "../../db";

async function createSession(userId: string): Promise<Schema> {
  return Session.insert({ id: generateID(), userId, createdAt: Date.now() });
}

async function checkSessionExist(id: string, userId: string): Promise<boolean> {
  return (await Session.get({ id, userId })).length > 0;
}

export default { createSession, checkSessionExist };
