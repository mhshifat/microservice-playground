import mongoose from "mongoose";
import createServer from "./app";
import nats from "./utils/nats";

if (!process.env.JWT_SECRET) throw new Error(`JWT_SECRET env missing`);

const app = createServer()

connectMongo()
  .then(() => {
    try {
      nats.connect("ticketing", "http://nats-srv:4222");
    } catch (error) {
      throw error;
    }
  })
  .then(() => {
    const server = app.listen(8001, () => console.log(`Listening on port 8001`));

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.info('Server closed');
          mongoose.connection.close();
          nats.client.close();
          process.exit();
        });
      } else {
        process.exit();
      }
    };
    
    const unexpectedErrorHandler = (error: any) => {
      console.error(error);
      exitHandler();
    };
    
    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);
    
    process.on('SIGTERM', (...args) => {
      console.info('SIGTERM received');
      if (server) {
        server.close(() => {
          console.info('Server closed');
          mongoose.connection.close();
          nats.client.close();
          process.exit();
        });
      }
    });
    process.on('SIGINT', (...args) => {
      console.info('SIGINT received');
      if (server) {
        server.close(() => {
          console.info('Server closed');
          mongoose.connection.close();
          nats.client.close();
          process.exit();
        });
      }
    });
  })
  .catch(err => {
    console.log("err: err", err);
    
    process.exit()
  })

async function connectMongo() {
  try {
    await mongoose.connect("mongodb://tickets-mongo-srv:27017/tickets");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}