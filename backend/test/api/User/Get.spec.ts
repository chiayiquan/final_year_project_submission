import request from "supertest";
import app from "../../../src/app";
import * as Test from "../../helper";

const getUserApi = async (
  jwt: string | null,
  responseStatus: number
): Promise<request.Test> => {
  return request(app)
    .get("/user/get")
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${jwt}`)
    .expect("Content-Type", /json/)
    .expect(responseStatus);
};

const user = {
  name: "test",
  email: "test@example.com",
  password: "123456789",
  walletPassword: "123456",
};

describe("Test for getUser", function () {
  beforeAll(async () => {
    await Test.cleanDb();
  });

  it("should return error when there invalid session", async () => {
    const response = await getUserApi("invalid-jwt", 400);
    expect(response.body.error.code).toBe("INVALID_JWT");
  });

  it("should return user data with jwt", async () => {
    const { user, jwt } = await Test.createUser();
    const response = await getUserApi(jwt, 200);
    const { id, name, email, role, createdAt, stripeUserId } = response.body;
    expect(id).toBe(user.id);
    expect(name).toBe(user.name);
    expect(email).toBe(user.email);
    expect(role).not.toBeNull();
    expect(createdAt).not.toBeNull();
    expect(stripeUserId).not.toBeNull();
  });
});
