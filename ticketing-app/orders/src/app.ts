import "express-async-errors";
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Joi from 'joi';
import cookieSession from 'cookie-session';
import extractAuthUser from "./middlewares/extractAuthUser";
import isAuthenticated from "./middlewares/isAuthenticated";
import RequestResponse from './utils/response';
import validateRequest from './middlewares/validateRequest';
import errHandler from './middlewares/errorHandler';
import nats from "./utils/nats";

interface OrderBody {
  ticketId: string;
}

enum OrderStatus {
  Created="created",
  Cancelled="cancelled",
  AwaitingPayment="awaiting:payment",
  Complete="complete",
}

type ITicket = {
  title: string;
  price: number;
  version: number;
}

type IOrder = {
  ticket: ITicket;
  userId: string;
  status: OrderStatus;
  expireAt: Date;
  version?: number;
}

const orderBodySchema = Joi.object<OrderBody>({
  ticketId: Joi.string().required(),
})
export const TicketModel = mongoose.model<ITicket & Document>("tickets", new mongoose.Schema({
  title: { type: String, trim: true, required: true },
  price: { type: Number,  required: true },
  version: { type: Number,  required: true },
}, { timestamps: true, toJSON: { transform(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
} } }))
export const OrderModel = mongoose.model<IOrder & Document>("orders", new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: "tickets", required: true },
  userId: { type: String, trim: true, required: true },
  expireAt: { type: mongoose.Schema.Types.Date, required: false },
  status: { type: String,  required: true, enum: Object.values(OrderStatus) },
  version: { type: Number,  required: false, default: 1 },
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

  app.get("/", (_, res) => res.send("Hello from Orders Sevice"));
  app.get("/api/orders", extractAuthUser, isAuthenticated, async (req, res) => {
    const orders = await OrderModel.find({
      userId: req.currentUser!.id,
    }).populate("ticket");
    return RequestResponse.success(res, orders, 200);
  });
  app.post("/api/orders", extractAuthUser, isAuthenticated, validateRequest(orderBodySchema), async (req: Request<any, any, OrderBody>, res: Response) => {
    const ticket = await TicketModel.findById(req.body.ticketId);
    if (!ticket) return RequestResponse.error(res, "Record not found!", 404);
    const reservedOrder = await OrderModel.findOne({ ticket, status: { $in: [
      OrderStatus.Created,
      OrderStatus.AwaitingPayment,
      OrderStatus.Complete
    ] } });
    if (reservedOrder) return RequestResponse.error(res, "Ticket is already reserverd", 403);
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + (15 * 60));
    const order = await OrderModel.create<Omit<IOrder, "createdAt" | "updatedAt">>({
      ticket,
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expireAt: expiration,
    });
    nats.publish("order:created", {
      ...order.toJSON(),
      ticket,
      expireAt: order.expireAt.toISOString()
    });
    return RequestResponse.success(res, order.toJSON(), 201);
  });
  app.get("/api/orders/:id", extractAuthUser, isAuthenticated, async (req: Request<{ id: string }, any, any>, res: Response) => {
    const order = await OrderModel.findOne({ _id: req.params.id, userId: req.currentUser!.id }).populate("ticket");
    if (!order) return RequestResponse.error(res, "Record not found!", 404);
    return RequestResponse.success(res, order.toJSON(), 200);
  });
  app.put("/api/orders/:id", extractAuthUser, isAuthenticated, validateRequest(orderBodySchema), async (req: Request<{ id: string }, any, OrderBody>, res: Response) => {
    const order = await OrderModel.findOneAndUpdate({
      _id: req.params.id,
      userId: req.currentUser?.id,
    }, {
      ...req.body,
      $inc: { version: 1 }
    }, {
      new: true
    }).populate("ticket");
    if (!order) return RequestResponse.error(res, "Record not found!", 404);
    return RequestResponse.success(res, order.toJSON(), 200);
  });
  app.delete("/api/orders/:id", extractAuthUser, isAuthenticated, async (req: Request<{ id: string }, any, any>, res: Response) => {
    const order = await OrderModel.findByIdAndUpdate({
      _id: req.params.id,
      userId: req.currentUser?.id
    }, {
      status: OrderStatus.Cancelled
    }, { new: true }).populate("ticket");
    if (!order) return RequestResponse.error(res, "Record not found!", 404);
    nats.publish("order:cancelled", {
      ...order.toJSON(),
      expireAt: order.expireAt.toISOString()
    });
    return RequestResponse.success(res, order.toJSON(), 200);
  });

  app.get("*", (_, res) => RequestResponse.error(res, "Not found", 404));
  app.use(errHandler);

  return app;
}