import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const postRegisterApi = async (
  data: { [key: string]: string | null },
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .post("/register")
    .set("Accept", "application/json")
    .send(data)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const user = {
  name: "test",
  email: "test@example.com",
  password: "123456789",
  walletPassword: "123456",
};

describe("Test for register", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should create user", async () => {
    await postRegisterApi(user, 200);
    const dbUser = await Test.db
      .select("id")
      .from("users")
      .where({ email: user.email });

    expect(dbUser.length).toBe(1);
    expect(dbUser[0].id).toMatch(/^0x/);
  });

  it("password should be encrypted", async () => {
    await postRegisterApi(
      { ...user, email: "encyptedpassword@example.com" },
      200
    );
    const dbUser = await Test.db
      .select("password")
      .from("users")
      .where({ email: "encyptedpassword@example.com" });
    expect(dbUser[0].password).not.toBe(user.password);
  });

  it("must be valid email", async () => {
    const response = await postRegisterApi(
      { ...user, email: "invalidemail" },
      400
    );
    expect(response.body.error.code).toBe("INVALID_EMAIL");
  });

  it("email must be unique", async () => {
    const response = await postRegisterApi(user, 400);
    expect(response.body.error.code).toBe("EMAIL_EXISTED");
  });
});
