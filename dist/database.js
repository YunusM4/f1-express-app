"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersCollection = exports.teamsCollection = exports.driversCollection = exports.client = void 0;
exports.login = login;
exports.register = register;
exports.connect = connect;
const mongodb_1 = require("mongodb");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Connectie met MongoDB via de URI in env
const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017";
exports.client = new mongodb_1.MongoClient(uri);
// Collections exporteren ==> andere bestanden kunnen gebruiken
exports.driversCollection = exports.client.db("f1-database").collection("drivers");
exports.teamsCollection = exports.client.db("f1-database").collection("teams");
exports.usersCollection = exports.client.db("f1-database").collection("users");
// Aantal rondes voor bcrypt hashing
const saltRounds = 10;
// Seed functie: vult de database met data als deze leeg is
async function seed() {
    // Drivers ophalen van GitHub en in MongoDB zetten
    if (await exports.driversCollection.countDocuments() === 0) {
        const driversRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/drivers.json");
        const drivers = await driversRes.json();
        await exports.driversCollection.insertMany(drivers);
        console.log("Drivers geseed!");
    }
    // Teams ophalen van GitHub en in MongoDB zetten
    if (await exports.teamsCollection.countDocuments() === 0) {
        const teamsRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/teams.json");
        const teams = await teamsRes.json();
        await exports.teamsCollection.insertMany(teams);
        console.log("Teams geseed!");
    }
    // Standaard gebruikers aanmaken als er nog geen zijn
    if (await exports.usersCollection.countDocuments() === 0) {
        const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
        const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
        const userUsername = process.env.USER_USERNAME ?? "user";
        const userPassword = process.env.USER_PASSWORD ?? "user123";
        await exports.usersCollection.insertMany([
            {
                username: adminUsername,
                // Wachtwoord wordt gehashed opgeslagen
                password: await bcrypt_1.default.hash(adminPassword, saltRounds),
                role: "ADMIN"
            },
            {
                username: userUsername,
                password: await bcrypt_1.default.hash(userPassword, saltRounds),
                role: "USER"
            }
        ]);
        console.log("Gebruikers geseed!");
    }
}
// Login functie: controleert username en wachtwoord
async function login(username, password) {
    if (username === "" || password === "") {
        throw new Error("Username en wachtwoord zijn verplicht");
    }
    // Gebruiker opzoeken in de database
    const user = await exports.usersCollection.findOne({ username });
    if (!user) {
        throw new Error("Gebruiker niet gevonden");
    }
    // Wachtwoord vergelijken  gehashte wachtwoord
    const match = await bcrypt_1.default.compare(password, user.password);
    if (!match) {
        throw new Error("Wachtwoord incorrect");
    }
    return user;
}
// Register een nieuwe gebruiker aan
async function register(username, password) {
    if (username === "" || password === "") {
        throw new Error("Username en wachtwoord zijn verplicht");
    }
    // Controleren gebruikersnaam al bestaat
    const existing = await exports.usersCollection.findOne({ username });
    if (existing) {
        throw new Error("Gebruikersnaam bestaat al");
    }
    // nieuwe gebruiker aanmaken  gehashed wachtwoord = USER role
    await exports.usersCollection.insertOne({
        username,
        password: await bcrypt_1.default.hash(password, saltRounds),
        role: "USER"
    });
}
//  database connectie netjes af bij CTRL+C
async function exit() {
    try {
        await exports.client.close();
        console.log("Disconnected from database");
    }
    catch (error) {
        console.error(error);
    }
    process.exit(0);
}
// verbinding met de database en seed de data
async function connect() {
    try {
        await exports.client.connect();
        console.log("Connected to database");
        await seed();
        process.on("SIGINT", exit);
    }
    catch (error) {
        console.error(error);
    }
}
