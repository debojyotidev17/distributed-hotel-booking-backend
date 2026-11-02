import { findUserById } from "../repositories/user.repository.js";
import { assignRoleToUser } from "../repositories/user-role.repository.js";
import {
    findRoleById,
    findAllRoles,
    createRole,
    updateRole,
    deleteRole,
    findRoleByName,
} from "../repositories/role.repository.js";
import type { CreateRoleDto, UpdateRoleDto } from "../dtos/role.dto.js";
import {
    BadRequestError,
    NotFoundError,
    ConflictError,
} from "../utils/errors/app.error.js";

// Assigns an existing role to an existing user.
export const assignRoleToUserService = async (
    userId: string,
    roleId: string,
) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const role = await findRoleById(roleId);

    if (!role) {
        throw new NotFoundError("Role not found");
    }

    const assignment = await assignRoleToUser(userId, roleId);

    if (!assignment) {
        throw new BadRequestError("User already has this role");
    }

    return assignment;
};

// Fetches a role using its ID.
export const getRoleByIdService = async (roleId: string) => {
    const role = await findRoleById(roleId);

    if (!role) {
        throw new NotFoundError("Role not found");
    }

    return role;
};

// Fetches all available roles.
export const getAllRolesService = async () => {
    return await findAllRoles();
};

// Creates a new role.
export const createRoleService = async (roleData: CreateRoleDto) => {
    const normalizedName = roleData.name.trim().toLowerCase();

    const existingRole = await findRoleByName(normalizedName);

    if (existingRole) {
        throw new ConflictError("Role already exists");
    }

    return await createRole({
        ...roleData,
        name: normalizedName,
    });
};

// Updates an existing role.
export const updateRoleService = async (
    roleId: string,
    roleData: UpdateRoleDto,
) => {
    const updatedRole = await updateRole(roleId, roleData);

    if (!updatedRole) {
        throw new NotFoundError("Role not found");
    }

    return updatedRole;
};

// Deletes an existing role.
export const deleteRoleService = async (roleId: string) => {
    const deletedRole = await deleteRole(roleId);

    if (!deletedRole) {
        throw new NotFoundError("Role not found");
    }

    return deletedRole;
};
