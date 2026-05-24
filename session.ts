import session from "express-session";
import { User, FlashMessage } from "./interfaces";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
dotenv.config();

// Sessie data opslaan in MongoDB
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI ?? "mongodb://localhost:27017",
  dbName: "f1-database",
  collectionName: "sessions",
});

mongoStore.on("error", (error) => {
  console.error(error);
});

// Sessie data interface uitbreiden met user en flash message
declare module "express-session" {
  export interface SessionData {
    user?: User;
    message?: FlashMessage;
  }
}

export default session({
  secret: process.env.SESSION_SECRET ?? "mijn-geheime-sleutel",
  store: mongoStore,
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
});
