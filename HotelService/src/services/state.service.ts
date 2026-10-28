import logger from "../config/logger.config.js";
import type {
    CreateStateDto,
    StateIdDto,
    UpdateStateDto,
} from "../dtos/state.dto.js";

import {
    createState,
    findStateByCode,
    findStateById,
    findStateByName,
    findAllStates,
    deleteState,
    updateState,
} from "../repositories/state.repository.js";

import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";

// creates a state or union territory
export async function createStateService(stateData: CreateStateDto) {
    const existingStateByName = await findStateByName(stateData.name);
    const existingStateByCode = await findStateByCode(stateData.code);

    if (existingStateByName || existingStateByCode) {
        logger.error("State name or code already exists");
        throw new BadRequestError("State name or code already exists");
    }

    const state = await createState(stateData);
    logger.info("State created successfully");

    return state;
}

// gets a state or union territory by id
export async function getStateByIdService(id: StateIdDto) {
    const state = await findStateById(id);

    if (!state) {
        logger.error("State not found");
        throw new NotFoundError("State not found");
    }

    logger.info("State retrieved successfully");

    return state;
}

// gets all states and union territories
export async function getAllStatesService() {
    const states = await findAllStates();
    logger.info("States retrieved successfully");

    return states;
}

// updates a state or union territory
export async function updateStateService(
    id: StateIdDto,
    updateData: UpdateStateDto,
) {
    const state = await findStateById(id);

    if (!state) {
        logger.error("State not found");
        throw new NotFoundError("State not found");
    }

    const updatedState = await updateState(id, updateData);
    logger.info("State updated successfully");

    return updatedState;
}

// deletes a state and its dependent cities and hotels through cascade deletion
export async function deleteStateService(id: StateIdDto) {
    const result = await deleteState(id);

    if (!result) {
        logger.error("State not found");
        throw new NotFoundError("State not found");
    }

    logger.info("State deleted successfully");

    return result;
}