import { Message } from 'node-nats-streaming';
import nats from '../nats';
import { TicketModel } from '../../app';

nats
  .subscribe("order:created", "ticket-service", async ({ data, msg }) => {
    try {
      const doc = await TicketModel.findByIdAndUpdate(data.ticket.id || data.ticket._id, {
        orderId: data.id
      }, { new: true });
      if (!doc) throw new Error(`Record not found while processing event: ${msg.getSubject()}`)
      console.log({data, doc});
      msg.ack()
    } catch (err) {
      
    }
  })

nats
  .subscribe("order:cancelled", "ticket-service", async ({ data, msg }) => {
    try {
      const doc = await TicketModel.findByIdAndUpdate(data.ticket.id || data.ticket._id, {
        orderId: null
      }, { new: true });
      if (!doc) throw new Error(`Record not found while processing event: ${msg.getSubject()}`)
      console.log("Acknowladge", {data, doc});
      msg.ack()
    } catch (err) {
      
    }
  });
