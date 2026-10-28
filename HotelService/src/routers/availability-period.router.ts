import express from "express";

import {
    availabilityCategoryParamsSchema,
    createAvailabilityPeriodsSchema,
} from "../validators/availability-period.validator.js";
import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";
import {
    createAvailabilityPeriodsHandler,
    getAvailabilityPeriodsHandler,
} from "../controllers/availability-period.controller.js";

const availabilityPeriodRouter = express.Router({ mergeParams: true });
// mergeParams: true tells Express to include the parameters from the parent router in the child router's req.params object.

availabilityPeriodRouter.get(
    "/",
    validateRequestParams(availabilityCategoryParamsSchema),
    getAvailabilityPeriodsHandler,
);

availabilityPeriodRouter.post(
    "/",
    validateRequestParams(availabilityCategoryParamsSchema),
    validateRequestBody(createAvailabilityPeriodsSchema),
    createAvailabilityPeriodsHandler,
);

export default availabilityPeriodRouter;
