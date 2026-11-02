import type { Request, Response } from "express";

import {
    assignRoleToUserService,
    getRoleByIdService,
    getAllRolesService,
    createRoleService,
    updateRoleService,
    deleteRoleService,
} from "../services/role.service.js";
import type {
    AssignRoleParamsDto,
    CreateRoleDto,
    UpdateRoleDto,
    RoleIdParamsDto,
} from "../dtos/role.dto.js";

// Assigns a role to a user.
export async function assignRoleToUserHandler(req: Request, res: Response) {
    const { userId, roleId } = req.params as unknown as AssignRoleParamsDto;

    const assignment = await assignRoleToUserService(userId, roleId);

    return res.status(200).json({
        success: true,
        message: "Role assigned to user successfully",
        data: assignment,
    });
}

// Creates a new role.
export async function createRoleHandler(req: Request, res: Response) {
    const roleData = req.body as CreateRoleDto;

    const role = await createRoleService(roleData);

    return res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: role,
    });
}

// Fetches all available roles.
export async function getAllRolesHandler(req: Request, res: Response) {
    const roles = await getAllRolesService();

    return res.status(200).json({
        success: true,
        message: "Roles fetched successfully",
        data: roles,
    });
}

// Fetches a role using its ID.
export async function getRoleByIdHandler(req: Request, res: Response) {
    const { id } = req.params as unknown as RoleIdParamsDto;

    const role = await getRoleByIdService(id);

    return res.status(200).json({
        success: true,
        message: "Role fetched successfully",
        data: role,
    });
}

// Updates an existing role.
export async function updateRoleHandler(req: Request, res: Response) {
    const { id } = req.params as unknown as RoleIdParamsDto;
    const roleData = req.body as UpdateRoleDto;

    const role = await updateRoleService(id, roleData);

    return res.status(200).json({
        success: true,
        message: "Role updated successfully",
        data: role,
    });
}

// Deletes an existing role.
export async function deleteRoleHandler(req: Request, res: Response) {
    const { id } = req.params as unknown as RoleIdParamsDto;

    await deleteRoleService(id);

    return res.status(200).json({
        success: true,
        message: "Role deleted successfully",
    });
}