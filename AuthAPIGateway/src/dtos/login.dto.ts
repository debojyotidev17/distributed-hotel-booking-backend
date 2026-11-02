import { z } from "zod";

import { loginSchema } from "../validators/login.validator.js";

export type LoginDto = z.infer<typeof loginSchema>;