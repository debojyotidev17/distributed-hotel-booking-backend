import logger from "../config/logger.config.js";
import type {
    CreateRoomCategoryDto,
    RoomCategoryHotelIdDto,
    RoomCategoryParamsDto,
    UpdateRoomCategoryDto,
} from "../dtos/room-category.dto.js";
import type { HotelIdDto } from "../dtos/hotel.dto.js";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";
import { findHotelById } from "../repositories/hotel.repository.js";
import {
    createRoomCategory,
    deleteRoomCategory,
    findRoomCategoriesByHotelId,
    findRoomCategoryById,
    findRoomCategoryByType,
    updateRoomCategory,
} from "../repositories/room-category.repository.js";

// Creates a room category under an existing hotel.
export async function createRoomCategoryService(
    hotelId: RoomCategoryHotelIdDto,
    data: CreateRoomCategoryDto,
) {
    const hotel = await findHotelById(hotelId as HotelIdDto);

    if (!hotel) {
        logger.warn("Hotel not found");
        throw new NotFoundError("Hotel not found");
    }

    const existingCategory = await findRoomCategoryByType(
        hotelId,
        data.roomType,
    );

    if (existingCategory) {
        logger.warn("This room type already exists for the hotel");
        throw new BadRequestError(
            "This room type already exists for the hotel",
        );
    }

    const category = await createRoomCategory(hotelId, data);
    logger.info("Room category created successfully");

    return category;
}

// Gets all room categories for a hotel.
export async function getRoomCategoriesByHotelIdService(
    hotelId: RoomCategoryHotelIdDto,
) {
    const hotel = await findHotelById(hotelId as HotelIdDto);

    if (!hotel) {
        logger.warn("Hotel not found");
        throw new NotFoundError("Hotel not found");
    }

    const categories = await findRoomCategoriesByHotelId(hotelId);
    logger.info("Room categories retrieved successfully");

    return categories;
}

// Gets one category only when it belongs to the specified hotel.
export async function getRoomCategoryByIdService(
    params: RoomCategoryParamsDto,
) {
    const category = await findRoomCategoryById(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    logger.info("Room category retrieved successfully");

    return category;
}

// Updates a category after checking that its new type is not already used.
export async function updateRoomCategoryService(
    params: RoomCategoryParamsDto,
    data: UpdateRoomCategoryDto,
) {
    // Check whether this room category exists under the specified hotel.
    const category = await findRoomCategoryById(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    // Check for duplicate room types only when the room type is being changed.
    if (data.roomType !== undefined) {
        const existingCategory = await findRoomCategoryByType(
            params.hotelId,
            data.roomType,
        );

        // Allow the category to keep its current room type, but prevent it from using a room type already assigned to another category.
        if (existingCategory && existingCategory.id !== params.roomCategoryId) {
            logger.warn("This room type already exists for the hotel");
            throw new BadRequestError(
                "This room type already exists for the hotel",
            );
        }
    }

    // Update only the fields provided in the request.
    // For example, the request can contain only a price or only a room type.
    const updatedCategory = await updateRoomCategory(params, data);

    logger.info("Room category updated successfully");

    return updatedCategory;
}


// Permanently deletes a category and lets PostgreSQL apply configured cascades.
export async function deleteRoomCategoryService(params: RoomCategoryParamsDto) {
    const category = await deleteRoomCategory(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    logger.info("Room category deleted successfully");

    return category;
}
