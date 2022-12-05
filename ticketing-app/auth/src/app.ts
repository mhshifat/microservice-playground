import "express-async-errors";
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import cookieSession from 'cookie-session';
import extractAuthUser from "./middlewares/extractAuthUser";
import RequestResponse from './utils/response';
import validateRequest from './middlewares/validateRequest';
import errHandler from './middlewares/errorHandler';
import { HttpError } from './utils/error';

interface SignUpBody {
  email: string;
  password: string;
}

type IUser = {
  email: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

const signUpSchema = Joi.object<SignUpBody>({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(10).required(),
})
export const UserModel = mongoose.model<IUser & Document>("users", new mongoose.Schema({
  email: { type: String, trim: true, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true, toJSON: { transform(doc, ret) {
  ret.id = ret._id;
  delete ret.password;
  delete ret._id;
  delete ret.__v;
} } }))

export default function createServer() {
  const app = express();
  app.set("trust proxy", true);

  app.use([
    cors(),
    express.json(),
    cookieSession({
      signed: false,
      secure: process.env.NODE_ENV !== "test"
    })
  ]);

  app.get("/", (_, res) => res.send("Hello from Auth Sevice"));
  app.get("/api/users", (_, res) => res.status(200).json({
    success: true,
    result: []
  }));
  app.get("/api/users/me", extractAuthUser, (req, res) => {
    return RequestResponse.success(res, req.currentUser, 200);
  });
  app.delete("/api/users/signout", (req, res) => {
    req.session = null;
    return RequestResponse.success(res, null, 200);
  });
  app.post("/api/users/signin", validateRequest(signUpSchema), async (req: Request<any, any, SignUpBody>, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) throw new HttpError(400, "Invalid Credentials");
    const isPwdMatched = await bcrypt.compare(password, existingUser.password!);
    if (!isPwdMatched) throw new HttpError(400, "Invalid Credentials");
    const payload: IUser = existingUser.toJSON();
    const token = jwt.sign(payload, process.env.JWT_SECRET!);
    req.session = { token };
    return RequestResponse.success(res, payload, 200);
  });
  app.post("/api/users/signup", validateRequest(signUpSchema), async (req: Request<any, any, SignUpBody>, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await UserModel.findOne<IUser>({ email });
    if (existingUser) throw new HttpError(409, "Already exists.");
    const hashedPass = await bcrypt.hash(password, 10);
    const user = await UserModel.create<Omit<IUser, "createdAt" | "updatedAt">>({ email, password: hashedPass });
    const payload: IUser = user.toJSON();
    const token = jwt.sign(payload, process.env.JWT_SECRET!);
    req.session = { token };
    return RequestResponse.success(res, payload, 201);
  });

  app.get("*", (_, res) => RequestResponse.error(res, "Not found", 404));
  app.use(errHandler);

  return app;
}