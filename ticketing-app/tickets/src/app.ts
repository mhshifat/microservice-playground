import "express-async-errors";
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi, { number } from 'joi';
import cookieSession from 'cookie-session';
import extractAuthUser from "./middlewares/extractAuthUser";
import isAuthenticated from "./middlewares/isAuthenticated";
import RequestResponse from './utils/response';
import validateRequest from './middlewares/validateRequest';
import errHandler from './middlewares/errorHandler';
import { HttpError } from './utils/error';
import nats from "./utils/nats";

interface TicketBody {
  title: string;
  price: string;
}

type ITicket = {
  title: string;
  price: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  orderId?: string;
}

const ticketBodySchema = Joi.object<TicketBody>({
  title: Joi.string().required(),
  price: Joi.number().required(),
})
export const TicketModel = mongoose.model<ITicket & Document>("tickets", new mongoose.Schema({
  title: { type: String, trim: true, required: true },
  price: { type: Number,  required: true },
  userId: { type: String, required: true },
  version: { type: Number, required: false, default: 1 },
  orderId: { type: String, required: false, default: null }
}, { timestamps: true, toJSON: { transform(doc, ret) {
  ret.id = ret._id;
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

  app.get("/", (_, res) => res.send("Hello from Tickets Sevice"));
  app.get("/api/tickets", async (_, res) => {
    const tickets = await TicketModel.find({});
    return RequestResponse.success(res, tickets, 200);
  });
  app.post("/api/tickets", extractAuthUser, isAuthenticated, validateRequest(ticketBodySchema), async (req: Request<any, any, TicketBody>, res: Response) => {
    const ticket = await TicketModel.create<Omit<ITicket, "createdAt" | "updatedAt">>({
      title: req.body.title,
      price: +req.body.price,
      userId: req.currentUser?.id
    });
    nats.publish("ticket:created", ticket.toJSON());
    return RequestResponse.success(res, ticket.toJSON(), 201);
  });
  app.get("/api/tickets/:id", async (req: Request<{ id: string }, any, any>, res: Response) => {
    const ticket = await TicketModel.findOne({ _id: req.params.id });
    if (!ticket) return RequestResponse.error(res, "Record not found!", 404);
    return RequestResponse.success(res, ticket.toJSON(), 200);
  });
  app.put("/api/tickets/:id", extractAuthUser, isAuthenticated, validateRequest(ticketBodySchema), async (req: Request<{ id: string }, any, TicketBody>, res: Response) => {
    const ticket = await TicketModel.findOneAndUpdate({
      _id: req.params.id,
      userId: req.currentUser?.id,
    }, {
      ...req.body,
      $inc: { version: 1 }
    }, { new: true });
    if (!ticket) return RequestResponse.error(res, "Record not found!", 404);
    if (ticket.orderId) return RequestResponse.error(res, "Cannot edit a reserved ticket!", 400);
    nats.publish("ticket:updated", ticket.toJSON());
    return RequestResponse.success(res, ticket.toJSON(), 200);
  });
  app.delete("/api/tickets/:id", extractAuthUser, isAuthenticated, async (req: Request<{ id: string }, any, any>, res: Response) => {
    const ticket = await TicketModel.findByIdAndRemove(req.params.id);
    if (!ticket) return RequestResponse.error(res, "Record not found!", 404);
    return RequestResponse.success(res, ticket.toJSON(), 200);
  });

  app.get("*", (_, res) => RequestResponse.error(res, "Not found", 404));
  app.use(errHandler);

  return app;
}