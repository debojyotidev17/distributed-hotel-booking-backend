import type {
    CityIdDto,
    CreateCityDto,
    ListCitiesQueryDto,
    UpdateCityDto,
} from "../dtos/city.dto.js";

import logger from "../config/logger.config.js";

import {
    createCity,
    findCityById,
    findCityByNameAndState,
    findAllCities,
    deleteCity,
    updateCity,
} from "../repositories/city.repository.js";

import { findStateById } from "../repositories/state.repository.js";

import {
    BadRequestError,
    NotFoundError,
    ConflictError,
} from "../utils/errors/app.error.js";

// Creates a city
export async function createCityService(cityData: CreateCityDto) {
    // Make sure the state exists before creating the city.
    const state = await findStateById(cityData.stateId);

    if (!state) {
        throw new NotFoundError("State not found");
    }

    // Prevent duplicate city names within the same state.
    const existingCity = await findCityByNameAndState(
        cityData.name,
        cityData.stateId,
    );

    if (existingCity) {
        throw new BadRequestError("City already exists in this state");
    }

    const city = await createCity(cityData);
    logger.info("City created successfully");

    return city;
}

// gets a city by id
export async function getCityByIdService(id: CityIdDto) {
    const city = await findCityById(id);

    if (!city) {
        logger.error("City not found");
        throw new NotFoundError("City not found");
    }

    logger.info("City retrieved successfully");

    return city;
}

// gets all cities, optionally filtered by state
export async function getAllCitiesService(query: ListCitiesQueryDto) {
    const cities = await findAllCities(query.stateId);
    logger.info("Cities retrieved successfully");

    return cities;
}

// Updates an existing city
export async function updateCityService(
    id: CityIdDto,
    updateData: UpdateCityDto,
) {
    const city = await findCityById(id);

    if (!city) {
        throw new NotFoundError("City not found");
    }

    // Check the state only when a new stateId is provided.
    if (updateData.stateId) {
        const state = await findStateById(updateData.stateId);

        if (!state) {
            throw new NotFoundError("State not found");
        }
    }

    // Prevent duplicate city names within the same state.
    const name = updateData.name ?? city.name;
    const stateId = updateData.stateId ?? city.stateId;

    const existingCity = await findCityByNameAndState(name, stateId);

    if (existingCity && existingCity.id !== city.id) {
        throw new ConflictError("City already exists in this state");
    }

    const updatedCity = await updateCity(id, updateData);

    logger.info("City updated successfully");

    return updatedCity;
}

// deletes a city and its dependent hotel records through cascade deletion
export async function deleteCityService(id: CityIdDto) {
    const result = await deleteCity(id);

    if (!result) {
        logger.error("City not found");
        throw new NotFoundError("City not found");
    }

    logger.info("City deleted successfully");

    return result;
}
