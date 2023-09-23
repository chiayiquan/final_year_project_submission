import * as Country from "./model";

async function checkCountryExist(code: string): Promise<boolean> {
  return (await Country.get({ code: code.trim().toUpperCase() })).length > 0;
}

async function getUnsupportedCountries(): Promise<Country.Schema[]> {
  return Country.getUnsupportedCountries();
}

export { checkCountryExist, getUnsupportedCountries };
