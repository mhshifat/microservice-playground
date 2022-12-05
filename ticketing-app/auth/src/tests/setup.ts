import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from 'mongoose';
import request from 'supertest';
import createServer from "../app";

declare global {
  function signup(): Promise<string[]>;
}

let mongo: any;
const app = createServer();

beforeAll(async () => {
  process.env.JWT_SECRET = "asdasdasdasdasdasdsads";
  process.env.NODE_ENV = "test";

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri);
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for (let col of collections) {
    await col.deleteMany({})
  }
})

afterAll(async () => {
  await mongo?.stop();
  await mongoose.connection.close();
});

global.signup = async () => {
  const res = await request(app)
    .post("/api/users/signup")
    .send({
      email: "test@test.com",
      password: "password"
    })
    .expect(201);

  return res.get("Set-Cookie");
}