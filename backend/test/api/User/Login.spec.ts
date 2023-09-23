import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const postLoginApi = async (
  data: { [key: string]: string | null },
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .post("/login")
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

describe("Test for login", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return user with jwt", async () => {
    const { user } = await Test.createUser();
    const response = await postLoginApi(
      { email: user.email, password: user.password },
      200
    );
    const data = response.body;
    expect(data.email).toBe(user.email);
    expect(data.jwt).not.toBeNull();
  });

  it("should check for incorrect password", async () => {
    const { user } = await Test.createUser();
    const response = await postLoginApi(
      { email: user.email, password: "incorrect_password" },
      400
    );
    expect(response.body.error.code).toBe("INCORRECT_ACCOUNT_INFO");
  });

  it("should check for invalid userid", async () => {
    const { user } = await Test.createUser();
    const response = await postLoginApi(
      { email: "non_existent@example.com", password: user.password },
      400
    );
    expect(response.body.error.code).toBe("INCORRECT_ACCOUNT_INFO");
  });
});
