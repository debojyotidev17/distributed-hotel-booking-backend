import type { Request, Response, NextFunction } from "express";

import {
    userHasAnyRole,
    userHasAllRoles,
} from "../repositories/user-role.repository.js";

import { ForbiddenError } from "../utils/errors/app.error.js";

// Allows access if the user has at least one required role.
export const requireAnyRole = (...roleNames: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = res.locals.userId as string;

        const hasRole = await userHasAnyRole(userId, roleNames);

        if (!hasRole) {
            throw new ForbiddenError("You do not have the required role");
        }

        next();
    };
};

// Allows access only if the user has all required roles.
export const requireAllRoles = (...roleNames: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = res.locals.userId as string;

        const hasRoles = await userHasAllRoles(userId, roleNames);

        if (!hasRoles) {
            throw new ForbiddenError("You do not have the required roles");
        }

        next();
    };
};
