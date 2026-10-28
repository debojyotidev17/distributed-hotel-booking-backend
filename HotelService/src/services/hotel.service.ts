import logger from "../config/logger.config.js";

import type {
    CreateHotelDto,
    CreateHotelRecordDto,
    HotelIdDto,
    UpdateHotelDto,
    UpdateHotelRecordDto,
} from "../dtos/hotel.dto.js";

import {
    createHotel,
    findAllHotels,
    findHotelById,
    deleteHotel,
    updateHotel,
} from "../repositories/hotel.repository.js";

import {
    findCityById,
    findCityByNameAndState,
} from "../repositories/city.repository.js";
import { findStateByName } from "../repositories/state.repository.js";
import { NotFoundError } from "../utils/errors/app.error.js";

// creates a hotel after resolving its city and state names
export async function createHotelService(hotelData: CreateHotelDto) {
    const state = await findStateByName(hotelData.stateName);

    if (!state) {
        logger.error("State not found");
        throw new NotFoundError("State not found");
    }

    const city = await findCityByNameAndState(hotelData.cityName, state.id);

    if (!city) {
        logger.error("City not found in the selected state");
        throw new NotFoundError("City not found in the selected state");
    }

    const hotelRecord: CreateHotelRecordDto = {
        name: hotelData.name,
        address: hotelData.address,
        cityId: city.id,
        rating: hotelData.rating,
        ratingCount: hotelData.ratingCount,
    };

    const hotel = await createHotel(hotelRecord);
    logger.info("Hotel created successfully");

    return hotel;
}

// gets a hotel by id
export async function getHotelByIdService(id: HotelIdDto) {
    const hotel = await findHotelById(id);

    if (!hotel) {
        logger.error("Hotel not found");
        throw new NotFoundError("Hotel not found");
    }

    logger.info("Hotel retrieved successfully");

    return hotel;
}

// gets all hotels
export async function getAllHotelsService() {
    const hotels = await findAllHotels();
    logger.info("Hotels retrieved successfully");

    return hotels;
}

// Updates a hotel and resolves its new city when a city name is provided.
export async function updateHotelService(
    id: HotelIdDto,
    hotelData: UpdateHotelDto,
) {
    const hotel = await findHotelById(id);

    if (!hotel) {
        logger.error("Hotel not found");
        throw new NotFoundError("Hotel not found");
    }

    // Separate location names from the other hotel fields.
    const { cityName, stateName, ...hotelFields } = hotelData;

    let hotelRecord: UpdateHotelRecordDto = hotelFields;

    // For a city-only update such as { "cityName": "Pune" }, the service finds the hotel’s current city to determine its state. If the owner sends both city and state names, the service resolves the new location using both.

    if (cityName !== undefined) {
        let stateId: string;

        if (stateName !== undefined) {
            const state = await findStateByName(stateName);

            if (!state) {
                logger.error("State not found");
                throw new NotFoundError("State not found");
            }

            stateId = state.id;
        } else {
            // Reuse the state of the hotel's current city.
            const currentCity = await findCityById(hotel.cityId);
            stateId = currentCity!.stateId;
        }

        const city = await findCityByNameAndState(cityName, stateId);

        if (!city) {
            logger.error("City not found in the selected state");
            throw new NotFoundError("City not found in the selected state");
        }

        // Store the resolved city ID instead of the city name.
        hotelRecord = { ...hotelFields, cityId: city.id };
    }

    const updatedHotel = await updateHotel(id, hotelRecord);

    if (!updatedHotel) {
        logger.error("Hotel not found");
        throw new NotFoundError("Hotel not found");
    }

    logger.info("Hotel updated successfully");

    return updatedHotel;
}

// deletes a hotel
export async function deleteHotelService(id: HotelIdDto) {
    const result = await deleteHotel(id);

    if (!result) {
        logger.error("Hotel not found");
        throw new NotFoundError("Hotel not found");
    }

    logger.info("Hotel deleted successfully");

    return result;
}
