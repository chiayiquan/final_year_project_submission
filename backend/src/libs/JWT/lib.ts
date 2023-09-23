import jwt from "jsonwebtoken";
import env from "../../env";
import express from "express";
import * as JD from "decoders";
import Session from "../Session";

const { JWT_SECRET } = env;

export type Payload = Readonly<{
  sessionId: string;
  userId: string;
}>;

function decodePayload(data: any): Payload {
  return JD.object({
    sessionId: JD.string,
    userId: JD.string,
  }).verify(data);
}

export class JWTError extends Error {
  name: keyof typeof errors;
  constructor(code: keyof typeof errors) {
    super(errors[code]);
    this.name = code;
  }
}

const errors = {
  INVALID_JWT: "Invalid JWT provided.",
  INVALID_SESSION: "Invalid Session.",
};

async function issue(sessionId: string, userId: string): Promise<string> {
  return jwt.sign({ userId, sessionId }, JWT_SECRET);
}

function getJWTFromHeader(expressRequest: express.Request): string {
  const authorization = String(expressRequest.header("Authorization"));
  const matches = authorization.match(/Bearer (.*)/);
  return matches == null ? "" : matches[1];
}

async function getJWTToken(
  expressRequest: express.Request
): Promise<Payload | JWTError> {
  const token = getJWTFromHeader(expressRequest);
  return verify(token);
}

async function verify(token: string): Promise<Payload | JWTError> {
  const verifyResult = verifyToken(token);
  if (verifyResult instanceof JWTError) return verifyResult;
  const isExisting = await Session.lib.checkSessionExist(
    verifyResult.sessionId,
    verifyResult.userId
  );
  return isExisting ? verifyResult : new JWTError("INVALID_SESSION");
}

function verifyToken(token: string): Payload | JWTError {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return decodePayload(payload);
  } catch (error) {
    return new JWTError("INVALID_JWT");
  }
}

export default { issue, getJWTToken, errors, verify, getJWTFromHeader };
