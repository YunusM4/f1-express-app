import { NextFunction, Request, Response } from "express";

// Controleert of de gebruiker ingelogd is
// Zo niet ==>doorgestuurd naar de login pagina
export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect("/login");
    }
}