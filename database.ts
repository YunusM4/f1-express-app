import { Collection, MongoClient } from "mongodb";
import { Driver, Team } from "./interfaces";

const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017";
export const client = new MongoClient(uri);

export const driversCollection: Collection<Driver> = client.db("f1-database").collection<Driver>("drivers");
export const teamsCollection: Collection<Team> = client.db("f1-database").collection<Team>("teams");

async function seed() {
    // Drivers seeden
    if (await driversCollection.countDocuments() === 0) {
        const driversRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/drivers.json");
        const drivers = await driversRes.json() as Driver[];
        await driversCollection.insertMany(drivers);
        console.log("Drivers geseed!");
    }

    // Teams seeden
    if (await teamsCollection.countDocuments() === 0) {
        const teamsRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/teams.json");
        const teams = await teamsRes.json() as Team[];
        await teamsCollection.insertMany(teams);
        console.log("Teams geseed!");
    }
}

async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

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