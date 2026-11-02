import { z } from "zod";

import {
    rolePermissionParamsSchema,
    rolePermissionBodySchema,
} from "../validators/role-permission.validator.js";

export type RolePermissionParamsDto = z.infer<
    typeof rolePermissionParamsSchema
>;

export type RolePermissionBodyDto = z.infer<typeof rolePermissionBodySchema>;
