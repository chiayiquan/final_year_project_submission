import * as JD from "decoders";
import axios from "axios";

function decodeError(data: any): { code: string; message: string } {
  const decodedData = JD.object({
    response: JD.object({
      data: JD.object({
        error: JD.object({
          code: JD.string,
          message: JD.string,
        }),
      }),
    }),
  }).verify(data);
  const { code, message } = decodedData.response.data.error;
  return { code, message };
}

function decodeMessageSuccess(data: any): { message: string } {
  const decodedData = JD.object({
    data: JD.object({
      message: JD.string,
    }),
  }).verify(data);
  const { message } = decodedData.data;
  return { message };
}

async function post(
  url: string,
  data: any,
  jwt?: string,
  headerParams: { [key: string]: string } = {}
) {
  const headers =
    jwt !== null
      ? { ...headerParams, Authorization: `Bearer ${jwt}` }
      : headerParams;
  return axios.post(url, data, { headers });
}

async function postMultipart(url: string, data: FormData, jwt?: string) {
  const headers =
    jwt !== null
      ? {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "multipart/form-data",
          },
        }
      : {};
  return axios.post(url, data, headers);
}

async function get(url: string, jwt?: string) {
  const headers =
    jwt !== null ? { headers: { Authorization: `Bearer ${jwt}` } } : {};
  return axios.get(url, headers);
}

export default { decodeError, post, get, postMultipart, decodeMessageSuccess };
