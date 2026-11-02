import express from "express";

import {
    createStateSchema,
    stateIdSchema,
    updateStateSchema,
} from "../validators/state.validator.js";

import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";

import {
    createStateHandler,
    deleteStateHandler,
    getAllStatesHandler,
    getStateByIdHandler,
    updateStateHandler,
} from "../controllers/state.controller.js";

const stateRouter = express.Router();

stateRouter.get("/", getAllStatesHandler);

stateRouter.get(
    "/:id",
    validateRequestParams(stateIdSchema),
    getStateByIdHandler,
);

stateRouter.post(
    "/",
    validateRequestBody(createStateSchema),
    createStateHandler,
);

stateRouter.patch(
    "/:id",
    validateRequestParams(stateIdSchema),
    validateRequestBody(updateStateSchema),
    updateStateHandler,
);

stateRouter.delete(
    "/:id",
    validateRequestParams(stateIdSchema),
    deleteStateHandler,
);

export default stateRouter;