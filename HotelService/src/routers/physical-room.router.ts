import express from "express";

import {
    createPhysicalRoomsSchema,
    physicalRoomParamsSchema,
} from "../validators/physical-room.validator.js";
import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";
import {
    createPhysicalRoomsHandler,
    getPhysicalRoomsHandler,
} from "../controllers/physical-room.controller.js";

const physicalRoomRouter = express.Router({ mergeParams: true });
// mergeParams: true tells Express to include the parameters from the parent router in the child router's req.params object.

physicalRoomRouter.get(
    "/",
    validateRequestParams(physicalRoomParamsSchema),
    getPhysicalRoomsHandler,
);

physicalRoomRouter.post(
    "/",
    validateRequestParams(physicalRoomParamsSchema),
    validateRequestBody(createPhysicalRoomsSchema),
    createPhysicalRoomsHandler,
);

export default physicalRoomRouter;
