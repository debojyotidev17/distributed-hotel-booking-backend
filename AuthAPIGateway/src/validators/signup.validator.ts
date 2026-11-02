import { z } from "zod";

export const signupSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(50, "Username cannot exceed 50 characters"),

    email: z.email("Please enter a valid email address"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(100, "Password cannot exceed 100 characters"),
});
