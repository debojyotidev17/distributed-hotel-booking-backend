import express from "express";

import {
    cityIdSchema,
    createCitySchema,
    listCitiesQuerySchema,
    updateCitySchema,
} from "../validators/city.validator.js";

import {
    validateQueryParams,
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";

import {
    createCityHandler,
    deleteCityHandler,
    getAllCitiesHandler,
    getCityByIdHandler,
    updateCityHandler,
} from "../controllers/city.controller.js";

const cityRouter = express.Router();

// Validates the optional stateId filter, for example GET /cities?stateId=<uuid>.
cityRouter.get(
    "/",
    validateQueryParams(listCitiesQuerySchema),
    getAllCitiesHandler,
);

cityRouter.get("/:id", validateRequestParams(cityIdSchema), getCityByIdHandler);

cityRouter.post("/", validateRequestBody(createCitySchema), createCityHandler);

cityRouter.patch(
    "/:id",
    validateRequestParams(cityIdSchema),
    validateRequestBody(updateCitySchema),
    updateCityHandler,
);

cityRouter.delete(
    "/:id",
    validateRequestParams(cityIdSchema),
    deleteCityHandler,
);

export default cityRouter;