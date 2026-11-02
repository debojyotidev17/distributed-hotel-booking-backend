import { z } from "zod";

// Validates the role ID received through route parameters.
export const rolePermissionParamsSchema = z.object({
    id: z.uuid(),
});

// Validates the permission ID received through the request body.
export const rolePermissionBodySchema = z.object({
    permissionId: z.uuid(),
});
