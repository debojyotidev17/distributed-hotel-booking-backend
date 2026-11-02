import { z } from "zod";

import {
    assignRoleParamsSchema,
    createRoleSchema,
    updateRoleSchema,
    roleIdParamsSchema,
} from "../validators/role.validator.js";

export type AssignRoleParamsDto = z.infer<typeof assignRoleParamsSchema>;

export type CreateRoleDto = z.infer<typeof createRoleSchema>;

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

export type RoleIdParamsDto = z.infer<typeof roleIdParamsSchema>;
