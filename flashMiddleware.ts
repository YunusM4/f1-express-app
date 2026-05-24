import { NextFunction, Request, Response } from "express";

// Haalt  flash message uit de sessie  zet deze in res.locals
//  message beschikbaar in de views en 1 keer getoond
export function flashMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.message) {
        res.locals.message = req.session.message;
        delete req.session.message;
    } else {
        res.locals.message = undefined;
    }
    next();
}