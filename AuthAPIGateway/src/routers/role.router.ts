import express from "express";

import {
    assignRoleToUserHandler,
    createRoleHandler,
    getAllRolesHandler,
    getRoleByIdHandler,
    updateRoleHandler,
    deleteRoleHandler,
} from "../controllers/role.controller.js";

import { authenticateMiddleware } from "../middlewares/authenticate.middleware.js";
import { requireAllRoles } from "../middlewares/authorize-role.middleware.js";

import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";

import {
    assignRoleParamsSchema,
    createRoleSchema,
    updateRoleSchema,
    roleIdParamsSchema,
} from "../validators/role.validator.js";

const roleRouter = express.Router();

// Allows only authenticated admins to assign roles to users.
roleRouter.post(
    "/:userId/assign/:roleId",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(assignRoleParamsSchema),
    assignRoleToUserHandler,
);

// Allows admins to create roles.
roleRouter.post(
    "/",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestBody(createRoleSchema),
    createRoleHandler,
);

// Allows admins to retrieve all roles.
roleRouter.get(
    "/",
    authenticateMiddleware,
    requireAllRoles("admin"),
    getAllRolesHandler,
);

// Allows admins to retrieve a role by ID.
roleRouter.get(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(roleIdParamsSchema),
    getRoleByIdHandler,
);

// Allows admins to update roles.
roleRouter.put(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(roleIdParamsSchema),
    validateRequestBody(updateRoleSchema),
    updateRoleHandler,
);

// Allows admins to delete roles.
roleRouter.delete(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    validateRequestParams(roleIdParamsSchema),
    deleteRoleHandler,
);

export default roleRouter;
