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

import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";

// creates a city
export async function createCityService(cityData: CreateCityDto) {
    const existingCity = await findCityByNameAndState(
        cityData.name,
        cityData.stateId,
    );

    if (existingCity) {
        logger.error("City already exists in this state");
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

// updates an existing city
export async function updateCityService(
    id: CityIdDto,
    updateData: UpdateCityDto,
) {
    const city = await findCityById(id);

    if (!city) {
        logger.error("City not found");
        throw new NotFoundError("City not found");
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
