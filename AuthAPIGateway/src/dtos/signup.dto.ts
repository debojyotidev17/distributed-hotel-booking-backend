import { z } from "zod";
import { signupSchema } from "../validators/signup.validator.js";

export type SignupDto = z.infer<typeof signupSchema>;
