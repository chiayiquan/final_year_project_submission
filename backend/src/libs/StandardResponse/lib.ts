import express from "express";

function success<T>(
  expressResponse: express.Response,
  data: T
): express.Response {
  return expressResponse.status(200).json(data);
}

function fail<T>(
  expressResponse: express.Response,
  errors: T,
  errorCode: keyof T
): express.Response {
  return expressResponse.status(400).json({
    error: { code: errorCode, message: errors[errorCode] },
  });
}

function serverFail(
  _expressRequest: express.Request,
  expressResponse: express.Response,
  _error: Error
): express.Response {
  return expressResponse.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal server error occurred.",
    },
  });
}

const defaultHeaders = {
  cacheControl: `private,max-age=31536000,immutable`, // 1 year
  contentType: "application/pdf",
  disposition: "inline",
};

function bufferSuccess(
  expressResponse: express.Response,
  data: Buffer,
  headers: {
    cacheControl: string;
    contentType: string;
    disposition: string;
  } = defaultHeaders
) {
  expressResponse.setHeader("Content-Type", headers.contentType);
  expressResponse.setHeader("Cache-Control", headers.cacheControl);

  expressResponse.setHeader("Content-Disposition", headers.disposition);

  expressResponse.send(data);
}

export default {
  success,
  fail,
  serverFail,
  bufferSuccess,
  defaultHeaders,
};
