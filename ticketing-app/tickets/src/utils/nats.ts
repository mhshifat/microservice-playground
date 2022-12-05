import natstreaming, { Stan, Message } from "node-nats-streaming";
import { randomBytes } from "crypto";

const nats = (() => {
  let instance: Stan;

  return {
    get client() {
      if (!instance) throw new Error("Nats can't connect before initialized!");
      return instance;
    },

    connect(cluster: string, url: string): Promise<void> {
      instance = natstreaming.connect(cluster, randomBytes(4).toString("hex"), { url });

      return new Promise((resolve, reject) => {
        instance.on("connect", () => {
          console.log("Nats connection established");
          require("./listeners");
          console.log("Nats listeners established");
          resolve();
        });
        instance.on("reject", () => {
          console.error("Nats connection failed");
          reject();
        });
        instance.on("close", () => {
          console.error("Nats connection closed");
          reject();
        });
      })
    },
    publish<TData extends any>(channel: string, data: TData): Promise<void> {
      return new Promise((resolve, reject) => {
        instance.publish(channel, JSON.stringify(data), (err) => {
          if (err) {
            console.error("Failed to send event to: " + channel);
            return reject()
          }
          
          console.log("Event sent to: " + channel);
          resolve();
        })
      })
    },
    subscribe(subject: string, group: string, callback: ({ data, msg }: { data: any, msg: Message }) => void) {      
      const options = instance
        .subscriptionOptions()
        .setAckWait(5 * 1000)
        .setManualAckMode(true)
        .setDeliverAllAvailable()
        .setDurableName("order-service");
      const subscription = instance.subscribe(subject, group, options);
      console.log("Subscribed to: " + subject);
      
      subscription.on("message", (msg: Message) => {
        console.log("Event Received");
        
        const content = msg.getData();
        if (typeof content === "string") {
          const data = JSON.parse(content);
          callback({data, msg});
        } else {
          const data = Buffer.from(content).toString("utf-8");
          callback({data, msg});
        }
      });
    }
  }
})()

export default nats;