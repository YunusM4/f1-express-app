"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureMiddleware = secureMiddleware;
// Controleert of de gebruiker ingelogd is
// Zo niet ==>doorgestuurd naar de login pagina
function secureMiddleware(req, res, next) {
    if (req.session.user) {
        res.locals.user = req.session.user;
        next();
    }
    else {
        res.redirect("/login");
    }
}
