"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const session_1 = __importDefault(require("./session"));
const secureMiddleware_1 = require("./secureMiddleware");
const flashMiddleware_1 = require("./flashMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.set("views", path_1.default.join(__dirname, "views"));
app.set("port", process.env.PORT || 3000);
// Middleware
app.use(session_1.default);
app.use(flashMiddleware_1.flashMiddleware);
//  LOGIN 
app.get("/login", (req, res) => {
    // Als gebruiker al ingelogd is gaat naar home
    if (req.session.user)
        return res.redirect("/");
    res.render("login", { message: res.locals.message });
});
app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        let user = await (0, database_1.login)(username, password);
        delete user.password;
        req.session.user = user;
        req.session.message = { type: "success", message: "Welkom " + user.username + "!" };
        res.redirect("/");
    }
    catch (e) {
        req.session.message = { type: "error", message: e.message };
        res.redirect("/login");
    }
});
//  REGISTER 
app.get("/register", (req, res) => {
    // Als gebruiker al ingelogd is gaat naar home
    if (req.session.user)
        return res.redirect("/");
    res.render("register", { message: res.locals.message });
});
app.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        await (0, database_1.register)(username, password);
        req.session.message = { type: "success", message: "Registratie gelukt! Je kan nu inloggen." };
        res.redirect("/login");
    }
    catch (e) {
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
app.get("/", secureMiddleware_1.secureMiddleware, async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const randomDrivers = await database_1.driversCollection.aggregate([
        { $match: { name: { $regex: search, $options: "i" } } },
        { $sample: { size: 5 } }
    ]).toArray();
    const randomTeams = await database_1.teamsCollection.aggregate([
        { $match: { name: { $regex: search, $options: "i" } } },
        { $sample: { size: 2 } }
    ]).toArray();
    res.render("index", { randomDrivers, randomTeams, search, user: req.session.user });
});
//  DRIVERS 
app.get("/drivers", secureMiddleware_1.secureMiddleware, async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";
    const sortOrder = sortDirection === "asc" ? 1 : -1;
    const drivers = await database_1.driversCollection
        .find({ name: { $regex: search, $options: "i" } })
        .sort({ [sortField]: sortOrder })
        .toArray();
    res.render("drivers", { drivers, search, sortField, sortDirection, user: req.session.user });
});
// DRIVER DETAIL
app.get("/drivers/:id", secureMiddleware_1.secureMiddleware, async (req, res) => {
    const driver = await database_1.driversCollection.findOne({ id: req.params.id });
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-detail", { driver, user: req.session.user });
});
// EDIT DRIVER forum (alleen ADMIN)
app.get("/drivers/:id/edit", secureMiddleware_1.secureMiddleware, async (req, res) => {
    if (req.session.user?.role !== "ADMIN") {
        return res.redirect("/drivers/" + req.params.id);
    }
    const driver = await database_1.driversCollection.findOne({ id: req.params.id });
    if (!driver) {
        res.status(404).send("Coureur niet gevonden");
        return;
    }
    res.render("driver-edit", { driver, user: req.session.user });
});
// EDIT DRIVER  formuleir  alleen ADMIN
app.post("/drivers/:id/edit", secureMiddleware_1.secureMiddleware, async (req, res) => {
    if (req.session.user?.role !== "ADMIN") {
        return res.redirect("/drivers/" + req.params.id);
    }
    await database_1.driversCollection.updateOne({ id: req.params.id }, { $set: {
            name: req.body.name,
            carNumber: parseInt(req.body.carNumber),
            driverStatus: req.body.driverStatus,
            isActive: req.body.isActive === "true",
            biography: req.body.biography
        } });
    res.redirect(`/drivers/${req.params.id}`);
});
//  TEAMS 
app.get("/teams", secureMiddleware_1.secureMiddleware, async (req, res) => {
    const search = req.query.search?.toString() ?? "";
    const sortField = req.query.sortField?.toString() ?? "name";
    const sortDirection = req.query.sortDirection?.toString() ?? "asc";
    const sortOrder = sortDirection === "asc" ? 1 : -1;
    const teams = await database_1.teamsCollection
        .find({ name: { $regex: search, $options: "i" } })
        .sort({ [sortField]: sortOrder })
        .toArray();
    res.render("teams", { teams, search, sortField, sortDirection, user: req.session.user });
});
// TEAM DETAIL
app.get("/teams/:id", secureMiddleware_1.secureMiddleware, async (req, res) => {
    const team = await database_1.teamsCollection.findOne({ id: req.params.id });
    if (!team) {
        res.status(404).send("Team niet gevonden");
        return;
    }
    const teamDrivers = await database_1.driversCollection.find({ "currentTeam.id": req.params.id }).toArray();
    res.render("team-detail", { team, teamDrivers, user: req.session.user });
});
app.listen(app.get("port"), async () => {
    await (0, database_1.connect)();
    console.log("Server started on http://localhost:" + app.get("port"));
});
