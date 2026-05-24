import { Collection, MongoClient } from "mongodb";
import { Driver, Team, User } from "./interfaces";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

// Connectie met MongoDB via de URI in env
const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017";
export const client = new MongoClient(uri);

// Collections exporteren ==> andere bestanden kunnen gebruiken
export const driversCollection: Collection<Driver> = client.db("f1-database").collection<Driver>("drivers");
export const teamsCollection: Collection<Team> = client.db("f1-database").collection<Team>("teams");
export const usersCollection: Collection<User> = client.db("f1-database").collection<User>("users");

// Aantal rondes voor bcrypt hashing
const saltRounds: number = 10;

// Seed functie: vult de database met data als deze leeg is
async function seed() {
    // Drivers ophalen van GitHub en in MongoDB zetten
    if (await driversCollection.countDocuments() === 0) {
        const driversRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/drivers.json");
        const drivers = await driversRes.json() as Driver[];
        await driversCollection.insertMany(drivers);
        console.log("Drivers geseed!");
    }

    // Teams ophalen van GitHub en in MongoDB zetten
    if (await teamsCollection.countDocuments() === 0) {
        const teamsRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/teams.json");
        const teams = await teamsRes.json() as Team[];
        await teamsCollection.insertMany(teams);
        console.log("Teams geseed!");
    }

    // Standaard gebruikers aanmaken als er nog geen zijn
    if (await usersCollection.countDocuments() === 0) {
        const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
        const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
        const userUsername = process.env.USER_USERNAME ?? "user";
        const userPassword = process.env.USER_PASSWORD ?? "user123";

        await usersCollection.insertMany([
            {
                username: adminUsername,
                // Wachtwoord wordt gehashed opgeslagen
                password: await bcrypt.hash(adminPassword, saltRounds),
                role: "ADMIN"
            },
            {
                username: userUsername,
                password: await bcrypt.hash(userPassword, saltRounds),
                role: "USER"
            }
        ]);
        console.log("Gebruikers geseed!");
    }
}

// Login functie: controleert username en wachtwoord
export async function login(username: string, password: string) {
    if (username === "" || password === "") {
        throw new Error("Username en wachtwoord zijn verplicht");
    }
    // Gebruiker opzoeken in de database
    const user = await usersCollection.findOne<User>({ username });
    if (!user) {
        throw new Error("Gebruiker niet gevonden");
    }
    // Wachtwoord vergelijken  gehashte wachtwoord
    const match = await bcrypt.compare(password, user.password!);
    if (!match) {
        throw new Error("Wachtwoord incorrect");
    }
    return user;
}

// Register een nieuwe gebruiker aan
export async function register(username: string, password: string) {
    if (username === "" || password === "") {
        throw new Error("Username en wachtwoord zijn verplicht");
    }
    // Controleren gebruikersnaam al bestaat
    const existing = await usersCollection.findOne({ username });
    if (existing) {
        throw new Error("Gebruikersnaam bestaat al");
    }
    // nieuwe gebruiker aanmaken  gehashed wachtwoord = USER role
    await usersCollection.insertOne({
        username,
        password: await bcrypt.hash(password, saltRounds),
        role: "USER"
    });
}

//  database connectie netjes af bij CTRL+C
async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

// verbinding met de database en seed de data
export async function connect() {
    try {
        await client.connect();
        console.log("Connected to database");
        await seed();
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}