import express from "express";

import {
    createRoomCategorySchema,
    roomCategoryHotelIdSchema,
    roomCategoryParamsSchema,
    updateRoomCategorySchema,
} from "../validators/room-category.validator.js";
import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";
import {
    createRoomCategoryHandler,
    deleteRoomCategoryHandler,
    getRoomCategoriesHandler,
    getRoomCategoryByIdHandler,
    updateRoomCategoryHandler,
} from "../controllers/room-category.controller.js";

import physicalRoomRouter from "./physical-room.router.js";
import availabilityPeriodRouter from "./availability-period.router.js";

const roomCategoryRouter = express.Router({ mergeParams: true });
// mergeParams: true tells Express to include the parameters from the parent router in the child router's req.params object.

roomCategoryRouter.get(
    "/",
    validateRequestParams(roomCategoryHotelIdSchema),
    getRoomCategoriesHandler,
);

roomCategoryRouter.post(
    "/",
    validateRequestParams(roomCategoryHotelIdSchema),
    validateRequestBody(createRoomCategorySchema),
    createRoomCategoryHandler,
);

// When you provide both hotelId and roomCategoryId, the function checks whether that specific room category belongs to that specific hotel.
roomCategoryRouter.get(
    "/:roomCategoryId",
    validateRequestParams(roomCategoryParamsSchema),
    getRoomCategoryByIdHandler,
);

roomCategoryRouter.patch(
    "/:roomCategoryId",
    validateRequestParams(roomCategoryParamsSchema),
    validateRequestBody(updateRoomCategorySchema),
    updateRoomCategoryHandler,
);

roomCategoryRouter.delete(
    "/:roomCategoryId",
    validateRequestParams(roomCategoryParamsSchema),
    deleteRoomCategoryHandler,
);

// Lists or registers physical rooms under the selected hotel category.
roomCategoryRouter.use(
    "/:roomCategoryId/physical-rooms",
    physicalRoomRouter,
);

// Lists or creates availability periods for the selected category.
roomCategoryRouter.use(
    "/:roomCategoryId/availability-periods",
    availabilityPeriodRouter,
);

export default roomCategoryRouter;