import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import Application from "../../libs/Application";
import db from "../../db";
import Organization from "../../libs/Organization";

const errors = {
  ...JWT.lib.errors,
  INSUFFICIENT_PERMISSION:
    "You do not have the permission to approve this application.",
  INVALID_APPLICATION: "Application does not exist.",
  UNKNOWN_ERROR: "Unexpected error occurred, please try again.",
  INVALID_ORGANIZATION: "There is no organization for this application.",
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  message: string;
};

type Params = {
  applicationId: string;
};

export default async function Reject(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const data = decodeParams(request.body);

  const application = await Application.lib.getApplicationById(
    data.applicationId
  );

  if (application == null) {
    return StandardResponse.fail(response, errors, "INVALID_APPLICATION");
  }

  const user = await User.lib.getUserById(jwtPayload.userId);

  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  if (
    (await Application.lib.checkSufficientPermission(application, user)) ===
    false
  ) {
    return StandardResponse.fail(response, errors, "INSUFFICIENT_PERMISSION");
  }

  await db.transaction(async (txn) => {
    const result = await Application.lib.updateApplicationStatus(
      application.id,
      "REJECTED",
      txn
    );

    const userRole = "USER";

    if (application.type === "ORGANIZATION") {
      const organization = await Organization.lib.getByUserId(
        application.userId
      );
      if (organization == null)
        return StandardResponse.fail(response, errors, "INVALID_ORGANIZATION");

      await Promise.all(
        organization.members.map(({ userId }) => {
          User.lib.updateRole(userId, userRole, txn);
        })
      );
    } else {
      await User.lib.updateRole(application.userId, userRole);
    }

    if (result === false) {
      return StandardResponse.fail(response, errors, "UNKNOWN_ERROR");
    }
  });

  return StandardResponse.success<ResponseData>(response, {
    message: "Application has been rejected",
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    applicationId: JD.string,
  }).verify(data);
}
