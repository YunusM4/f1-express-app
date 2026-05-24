"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flashMiddleware = flashMiddleware;
// Haalt  flash message uit de sessie  zet deze in res.locals
//  message beschikbaar in de views en 1 keer getoond
function flashMiddleware(req, res, next) {
    if (req.session.message) {
        res.locals.message = req.session.message;
        delete req.session.message;
    }
    else {
        res.locals.message = undefined;
    }
    next();
}
