import request from "supertest";
import createServer from "../../app";

const app = createServer();

describe('Signup route tests', () => {
  it("Should return a 201 on successfull signup", async () => {
    return request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "password"
      })
      .expect(201)
  })
  
  it("Should return a 422 on empty body", async () => {
    return request(app)
      .post("/api/users/signup")
      .send({})
      .expect(422)
  })
  
  it("Should return a 422 on invalid body", async () => {
    return request(app)
      .post("/api/users/signup")
      .send({
        email: "test",
        password: "password"
      })
      .expect(422)
  })
  
  it("Should return a 409 on duplicate email", async () => {
    await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "password"
      })
      .expect(201)
  
    return request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "password"
      })
      .expect(409)
  })
  
  it("Should set a cookie on succesfull signup", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "password"
      })
      .expect(201);
    
    expect(res.get("Set-Cookie")).toBeDefined();
  })
  
  it("Should return an user object on succesfull signup", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "password"
      })
      .expect(201);
    
    expect(res.body.result).toHaveProperty("email", "test@test.com");
    expect(res.body.result).toHaveProperty("id");
  })
});