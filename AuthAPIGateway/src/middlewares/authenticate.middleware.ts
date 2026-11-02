import type { Request, Response, NextFunction } from "express";

import { verifyAccessToken } from "../utils/helpers/jwt.helper.js";
import { UnauthorizedError } from "../utils/errors/app.error.js";

// Authenticates requests using the access token.
export function authenticateMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    // Reads the Authorization header sent by the frontend.
    // Authorization: Bearer <accessToken>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Access token is required");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        throw new UnauthorizedError("Access token is required");
    }

    const userId = verifyAccessToken(token);

    // Makes the authenticated user's ID available to the next handler.
    res.locals.userId = userId;

    next();
}
