import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as Country from "../../libs/Country";

type ResponseData = {
  countries: Country.Schema[];
};

export default async function ListUnsupported(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const countries = await Country.getUnsupportedCountries();

  return StandardResponse.success<ResponseData>(response, {
    countries,
  });
}
