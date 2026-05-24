import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { Driver, Team } from "./interfaces";

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("port", process.env.PORT || 3000);

let drivers: Driver[] = [];
let teams: Team[] = [];

app.get("/", (req, res) => {
    const search = req.query.search?.toString() ?? "";

    const randomDrivers = [...drivers]
        .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

    const randomTeams = [...teams]
        .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

    res.render("index", { randomDrivers, randomTeams, search });
});

app.get("/drivers", (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";

    let filtered = drivers.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a: any, b: any) => {
        if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    res.render("drivers", { drivers: filtered, search, sortField, sortDirection });
});

app.get("/drivers/:id", (req, res) => {
    const driver = drivers.find(d => d.id === req.params.id);
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-detail", { driver });
});

app.get("/teams", (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";

    let filtered = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a: any, b: any) => {
        if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    res.render("teams", { teams: filtered, search, sortField, sortDirection });
});
app.get("/teams/:id", (req, res) => {
    const team = teams.find(t => t.id === req.params.id);
    if (!team) {
        res.status(404).send("Team niet gevonden");
        return;
    }
    const teamDrivers = drivers.filter(d => d.currentTeam.id === req.params.id);
    res.render("team-detail", { team, teamDrivers });
});

app.listen(app.get("port"), async () => {
    const driversRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/drivers.json");
    drivers = await driversRes.json() as Driver[];

    const teamsRes = await fetch("https://raw.githubusercontent.com/YunusM4/ProjectWeb-jsonHosten/main/data/teams.json");
    teams = await teamsRes.json() as Team[];

    console.log("Server started on http://localhost:" + app.get("port"));
});