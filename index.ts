import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { Driver, Team, User } from "./interfaces";
import { connect, driversCollection, teamsCollection, login, register } from "./database";
import session from "./session";
import { secureMiddleware } from "./secureMiddleware";
import { flashMiddleware } from "./flashMiddleware";

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("port", process.env.PORT || 3000);

// Middleware
app.use(session);
app.use(flashMiddleware);

//  LOGIN 
app.get("/login", (req, res) => {
    // Als gebruiker al ingelogd is gaat naar home
    if (req.session.user) return res.redirect("/");
    res.render("login", { message: res.locals.message });
});

app.post("/login", async (req, res) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    try {
        let user: User = await login(username, password);
        delete user.password;
        req.session.user = user;
        req.session.message = { type: "success", message: "Welkom " + user.username + "!" };
        res.redirect("/");
    } catch (e: any) {
        req.session.message = { type: "error", message: e.message };
        res.redirect("/login");
    }
});

//  REGISTER 
app.get("/register", (req, res) => {
    // Als gebruiker al ingelogd is gaat naar home
    if (req.session.user) return res.redirect("/");
    res.render("register", { message: res.locals.message });
});

app.post("/register", async (req, res) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    try {
        await register(username, password);
        req.session.message = { type: "success", message: "Registratie gelukt! Je kan nu inloggen." };
        res.redirect("/login");
    } catch (e: any) {
        req.session.message = { type: "error", message: e.message };
        res.redirect("/register");
    }
});

//  LOGOUT 
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

//  HOME 
app.get("/", secureMiddleware, async (req, res) => {
    const search = req.query.search?.toString() ?? "";

    const randomDrivers = await driversCollection.aggregate<Driver>([
        { $match: { name: { $regex: search, $options: "i" } } },
        { $sample: { size: 5 } }
    ]).toArray();

    const randomTeams = await teamsCollection.aggregate<Team>([
        { $match: { name: { $regex: search, $options: "i" } } },
        { $sample: { size: 2 } }
    ]).toArray();

    res.render("index", { randomDrivers, randomTeams, search, user: req.session.user });
});

//  DRIVERS 
app.get("/drivers", secureMiddleware, async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";
    const sortOrder = sortDirection === "asc" ? 1 : -1;

    const drivers = await driversCollection
        .find({ name: { $regex: search, $options: "i" } })
        .sort({ [sortField]: sortOrder })
        .toArray();

    res.render("drivers", { drivers, search, sortField, sortDirection, user: req.session.user });
});

// DRIVER DETAIL
app.get("/drivers/:id", secureMiddleware, async (req, res) => {
    const driver = await driversCollection.findOne({ id: req.params.id });
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-detail", { driver, user: req.session.user });
});

// EDIT DRIVER forum (alleen ADMIN)
app.get("/drivers/:id/edit", secureMiddleware, async (req, res) => {
    if (req.session.user?.role !== "ADMIN") {
        return res.redirect("/drivers/" + req.params.id);
    }
    const driver = await driversCollection.findOne({ id: req.params.id });
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-edit", { driver, user: req.session.user });
});

// EDIT DRIVER  formuleir  alleen ADMIN
app.post("/drivers/:id/edit", secureMiddleware, async (req, res) => {
    if (req.session.user?.role !== "ADMIN") {
        return res.redirect("/drivers/" + req.params.id);
    }
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

//  TEAMS 
app.get("/teams", secureMiddleware, async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";
    const sortOrder = sortDirection === "asc" ? 1 : -1;

    const teams = await teamsCollection
        .find({ name: { $regex: search, $options: "i" } })
        .sort({ [sortField]: sortOrder })
        .toArray();

    res.render("teams", { teams, search, sortField, sortDirection, user: req.session.user });
});

// TEAM DETAIL
app.get("/teams/:id", secureMiddleware, async (req, res) => {
    const team = await teamsCollection.findOne({ id: req.params.id });
    if (!team) {
        res.status(404).send("Team niet gevonden");
        return;
    }
    const teamDrivers = await driversCollection.find({ "currentTeam.id": req.params.id }).toArray();
    res.render("team-detail", { team, teamDrivers, user: req.session.user });
});

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get("port"));
});