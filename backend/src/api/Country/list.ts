import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as Contract from "../../libs/Contract";

type ResponseData = {
  countries: Contract.ListSchema[];
};

export default async function List(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const countries = await Contract.getSupportedCountries();

  return StandardResponse.success<ResponseData>(response, {
    countries,
  });
}
