import mongoose from "mongoose";
import createServer from "./app";

if (!process.env.JWT_SECRET) throw new Error(`JWT_SECRET env missing`);

const app = createServer()

connectMongo().then(() => {
  const server = app.listen(8000, () => console.log(`Listening on port 8000`));

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info('Server closed');
        mongoose.connection.close();
        process.exit(1);
      });
    } else {
      process.exit(1);
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
        process.exit(1);
      });
    }
  });
})

async function connectMongo() {
  try {
    await mongoose.connect("mongodb://auth-mongo-srv:27017/auth");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}