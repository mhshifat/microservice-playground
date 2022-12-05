import { Message } from 'node-nats-streaming';
import nats from '../nats';
import { TicketModel } from './../../app';

nats
  .subscribe("ticket:created", "order-service", async ({ data, msg }) => {
    const doc = await TicketModel.create({
      _id: data.id,
      title: data.title,
      price: data.price,
      version: data.version,
    })
    console.log({data, doc});
    msg.ack()
  })

nats
  .subscribe("ticket:updated", "order-service", async ({ data, msg }) => {
    try {
      const doc = await TicketModel.findById(data.id);
      console.log({data, doc});
      if (!doc) throw new Error(`Record not found while processing event: ${msg.getSubject()}`)
      if (doc.version !== (data.version - 1)) throw new Error(`Record version mismatched while processing event: ${msg.getSubject()}`);
      doc.set({
        title: data.title,
        price: data.price,
        version: data.version
      });
      await doc.save();
      console.log("Acknowladge", {data, doc});
      msg.ack()
    } catch (err) {
      
    }
  });
