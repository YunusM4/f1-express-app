import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { Driver, Team } from "./interfaces";
import { connect, driversCollection, teamsCollection } from "./database";

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("port", process.env.PORT || 3000);

// HOME
app.get("/", async (req, res) => {
    const search = req.query.search?.toString() ?? "";

    const randomDrivers = await driversCollection.aggregate<Driver>([
        { $match: { name: { $regex: search, $options: "i" } } },
        { $sample: { size: 5 } }
    ]).toArray();

    const randomTeams = await teamsCollection.aggregate<Team>([
        { $match: { name: { $regex: search, $options: "i" } } },
        { $sample: { size: 2 } }
    ]).toArray();

    res.render("index", { randomDrivers, randomTeams, search });
});

// DRIVERS
app.get("/drivers", async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";

    const sortOrder = sortDirection === "asc" ? 1 : -1;

    const drivers = await driversCollection
        .find({ name: { $regex: search, $options: "i" } })
        .sort({ [sortField]: sortOrder })
        .toArray();

    res.render("drivers", { drivers, search, sortField, sortDirection });
});

// DRIVER DETAIL
app.get("/drivers/:id", async (req, res) => {
    const driver = await driversCollection.findOne({ id: req.params.id });
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-detail", { driver });
});

// TEAMS
app.get("/teams", async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";

    const sortOrder = sortDirection === "asc" ? 1 : -1;

    const teams = await teamsCollection
        .find({ name: { $regex: search, $options: "i" } })
        .sort({ [sortField]: sortOrder })
        .toArray();

    res.render("teams", { teams, search, sortField, sortDirection });
});

// TEAM DETAIL
app.get("/teams/:id", async (req, res) => {
    const team = await teamsCollection.findOne({ id: req.params.id });
    if (!team) {
        res.status(404).send("Team niet gevonden");
        return;
    }
    const teamDrivers = await driversCollection.find({ "currentTeam.id": req.params.id }).toArray();
    res.render("team-detail", { team, teamDrivers });
});

// EDIT DRIVER - formulier tonen
app.get("/drivers/:id/edit", async (req, res) => {
    const driver = await driversCollection.findOne({ id: req.params.id });
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-edit", { driver });
});

// EDIT DRIVER - formulier verwerken
app.post("/drivers/:id/edit", async (req, res) => {
    await driversCollection.updateOne(
        { id: req.params.id },
        { $set: {
            name: req.body.name,
            carNumber: parseInt(req.body.carNumber),
            driverStatus: req.body.driverStatus,
            isActive: req.body.isActive === "true",
            biography: req.body.biography
        }}
    );
    res.redirect(`/drivers/${req.params.id}`);
});

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get("port"));
});

