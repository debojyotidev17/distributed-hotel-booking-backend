import { Router } from "express";
import {
    createRoomHoldController,
    releaseRoomHoldController,
} from "../controllers/booking-hold.controller.js";
import { validateRequestBody ,validateRequestParams} from "../validators/index.js";
import {
    createRoomHoldSchema,
    releaseRoomHoldParamsSchema,
} from "../validators/booking-hold.validator.js";

const bookingHoldRouter = Router();

bookingHoldRouter.post(
    "/",
    validateRequestBody(createRoomHoldSchema),
    createRoomHoldController,
);

bookingHoldRouter.delete(
    "/:bookingId",
    validateRequestParams(releaseRoomHoldParamsSchema),
    releaseRoomHoldController,
);

export default bookingHoldRouter;
