"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Sessie data opslaan in MongoDB
const mongoStore = connect_mongo_1.default.create({
    mongoUrl: process.env.MONGO_URI ?? "mongodb://localhost:27017",
    dbName: "f1-database",
    collectionName: "sessions",
});
mongoStore.on("error", (error) => {
    console.error(error);
});
exports.default = (0, express_session_1.default)({
    secret: process.env.SESSION_SECRET ?? "mijn-geheime-sleutel",
    store: mongoStore,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
});
