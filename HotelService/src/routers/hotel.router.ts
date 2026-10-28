import express from "express";

import {
    createHotelSchema,
    hotelIdSchema,
    updateHotelSchema,
} from "../validators/hotel.validator.js";

import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";

import roomCategoryRouter from "./room-category.router.js";

import {
    createHotelHandler,
    deleteHotelHandler,
    getAllHotelsHandler,
    getHotelByIdHandler,
    updateHotelHandler,
} from "../controllers/hotel.controller.js";

const hotelRouter = express.Router();

// Lists all hotels.
hotelRouter.get("/", getAllHotelsHandler);

// Gets one hotel after validating the hotel ID.
hotelRouter.get(
    "/:id",
    validateRequestParams(hotelIdSchema),
    getHotelByIdHandler,
);

// Creates a hotel after validating its details and city/state names.
hotelRouter.post(
    "/",
    validateRequestBody(createHotelSchema),
    createHotelHandler,
);

// Updates selected hotel fields after validating the ID and update body.
hotelRouter.patch(
    "/:id",
    validateRequestParams(hotelIdSchema),
    validateRequestBody(updateHotelSchema),
    updateHotelHandler,
);

// Deletes a hotel.
hotelRouter.delete(
    "/:id",
    validateRequestParams(hotelIdSchema),
    deleteHotelHandler,
);

// Handles categories nested under a hotel.
hotelRouter.use("/:hotelId/room-categories", roomCategoryRouter);
// POST /hotels/<hotel-id>/room-categories creates a category for that hotel.

export default hotelRouter;