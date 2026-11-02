import { findRoleById } from "../repositories/role.repository.js";
import { findPermissionById } from "../repositories/permission.repository.js";

import {
    findRolePermissionsByRoleId,
    assignPermissionToRole,
    removePermissionFromRole,
    findAllRolePermissions,
} from "../repositories/role-permission.repository.js";

import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";

// Fetches all permissions assigned to a role.
export const getRolePermissionsService = async (roleId: string) => {
    const role = await findRoleById(roleId);

    if (!role) {
        throw new NotFoundError("Role not found");
    }

    return await findRolePermissionsByRoleId(roleId);
};

// Assigns a permission to a role.
export const assignPermissionToRoleService = async (
    roleId: string,
    permissionId: string,
) => {
    const role = await findRoleById(roleId);

    if (!role) {
        throw new NotFoundError("Role not found");
    }

    const permission = await findPermissionById(permissionId);

    if (!permission) {
        throw new NotFoundError("Permission not found");
    }

    const assignment = await assignPermissionToRole(roleId, permissionId);

    if (!assignment) {
        throw new BadRequestError(
            "This permission is already assigned to the role",
        );
    }

    return assignment;
};

// Removes a permission from a role.
export const removePermissionFromRoleService = async (
    roleId: string,
    permissionId: string,
) => {
    const role = await findRoleById(roleId);

    if (!role) {
        throw new NotFoundError("Role not found");
    }

    const permission = await findPermissionById(permissionId);

    if (!permission) {
        throw new NotFoundError("Permission not found");
    }

    const deletedAssignment = await removePermissionFromRole(
        roleId,
        permissionId,
    );

    if (!deletedAssignment) {
        throw new NotFoundError("Permission is not assigned to this role");
    }

    return deletedAssignment;
};

// Fetches all role-permission assignments.
export const getAllRolePermissionsService = async () => {
    return await findAllRolePermissions();
};
