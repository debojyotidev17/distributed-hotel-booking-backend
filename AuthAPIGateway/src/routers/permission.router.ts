import express from "express";

import {
    getRolePermissionsHandler,
    assignPermissionToRoleHandler,
    removePermissionFromRoleHandler,
    getAllRolePermissionsHandler,
} from "../controllers/role-permission.controller.js";

import {
    rolePermissionParamsSchema,
    rolePermissionBodySchema,
} from "../validators/role-permission.validator.js";

import { authenticateMiddleware } from "../middlewares/authenticate.middleware.js";
import { requireAllRoles } from "../middlewares/authorize-role.middleware.js";

import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";

const permissionRouter = express.Router();

// Allows admins to fetch permissions assigned to a role.
permissionRouter.get(
    "/:id/permissions",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(rolePermissionParamsSchema),
    getRolePermissionsHandler,
);

// Allows admins to assign a permission to a role.
permissionRouter.post(
    "/:id/permissions",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(rolePermissionParamsSchema),
    validateRequestBody(rolePermissionBodySchema),
    assignPermissionToRoleHandler,
);

// Allows admins to remove a permission from a role.
permissionRouter.delete(
    "/:id/permissions",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(rolePermissionParamsSchema),
    validateRequestBody(rolePermissionBodySchema),
    removePermissionFromRoleHandler,
);

// Allows admins to fetch all role-permission assignments.
permissionRouter.get(
    "/role-permissions",
    authenticateMiddleware,
    requireAllRoles("admin"),
    getAllRolePermissionsHandler,
);

export default permissionRouter;
