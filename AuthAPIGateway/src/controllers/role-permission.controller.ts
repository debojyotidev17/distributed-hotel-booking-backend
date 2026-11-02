import type { Request, Response } from "express";

import {
    getRolePermissionsService,
    assignPermissionToRoleService,
    removePermissionFromRoleService,
    getAllRolePermissionsService,
} from "../services/role-permission.service.js";

import type {
    RolePermissionParamsDto,
    RolePermissionBodyDto,
} from "../dtos/role-permission.dto.js";

// Fetches all permissions assigned to a role.
export async function getRolePermissionsHandler(req: Request, res: Response) {
    const { id } = req.params as unknown as RolePermissionParamsDto;

    const rolePermissions = await getRolePermissionsService(id);

    return res.status(200).json({
        success: true,
        message: "Role permissions fetched successfully",
        data: rolePermissions,
    });
}

// Assigns a permission to a role.
export async function assignPermissionToRoleHandler(
    req: Request,
    res: Response,
) {
    const { id } = req.params as unknown as RolePermissionParamsDto;
    const { permissionId } = req.body as RolePermissionBodyDto;

    const assignment = await assignPermissionToRoleService(id, permissionId);

    return res.status(201).json({
        success: true,
        message: "Permission assigned to role successfully",
        data: assignment,
    });
}

// Removes a permission from a role.
export async function removePermissionFromRoleHandler(
    req: Request,
    res: Response,
) {
    const { id } = req.params as unknown as RolePermissionParamsDto;
    const { permissionId } = req.body as RolePermissionBodyDto;

    await removePermissionFromRoleService(id, permissionId);

    return res.status(200).json({
        success: true,
        message: "Permission removed from role successfully",
    });
}

// Fetches all role-permission assignments.
export async function getAllRolePermissionsHandler(
    req: Request,
    res: Response,
) {
    const rolePermissions = await getAllRolePermissionsService();

    return res.status(200).json({
        success: true,
        message: "All role permissions fetched successfully",
        data: rolePermissions,
    });
}
