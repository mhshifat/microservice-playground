import request from "supertest";
import createServer from "../../app";

const app = createServer();

describe('Current user route tests', () => {
  it("Should return an user object on succesfull signup", async () => {
    const cookie = await global.signup();
    const res = await request(app)
      .get("/api/users/me")
      .set("Cookie", cookie)
      .send()
      .expect(200);
    
    expect(res.body.result).toHaveProperty("email", "test@test.com");
    expect(res.body.result).toHaveProperty("id");
  })

  it("Should return null on unauthenticated request", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .send()
      .expect(200);
    
    expect(res.body.result).toBeUndefined();
  })
});