import type { Request, Response, NextFunction } from "express";

import { userHasPermission } from "../repositories/permission.repository.js";
import { ForbiddenError } from "../utils/errors/app.error.js";
import { UnauthorizedError } from "../utils/errors/app.error.js";

// Checks whether the authenticated user has the required permission.
export const requirePermission = (permissionName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = res.locals.userId as string | undefined;

        if (!userId) {
            throw new UnauthorizedError("Authentication is required");
        }

        const hasPermission = await userHasPermission(userId, permissionName);

        if (!hasPermission) {
            throw new ForbiddenError(
                `You do not have permission to perform this action`,
            );
        }

        next();
    };
};
