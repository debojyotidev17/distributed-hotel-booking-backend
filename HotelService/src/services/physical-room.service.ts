import logger from "../config/logger.config.js";
import type {
    CreatePhysicalRoomsDto,
    PhysicalRoomParamsDto,
} from "../dtos/physical-room.dto.js";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";
import { findRoomCategoryById } from "../repositories/room-category.repository.js";
import {
    createPhysicalRooms,
    findExistingPhysicalRooms,
    findPhysicalRoomsByCategory,
} from "../repositories/physical-room.repository.js";

// Registers physical room numbers after checking that the category exists.
export async function createPhysicalRoomsService(
    params: PhysicalRoomParamsDto,
    data: CreatePhysicalRoomsDto,
) {
    const category = await findRoomCategoryById(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    const existingRooms = await findExistingPhysicalRooms(
        params.roomCategoryId,
        data.roomNumbers,
    );

    if (existingRooms.length > 0) {
        logger.warn("One or more room numbers already exist in this category");
        throw new BadRequestError(
            "One or more room numbers already exist in this category",
        );
    }

    const rooms = await createPhysicalRooms(params, data);
    logger.info("Physical rooms registered successfully");

    return rooms;
}

// Lists registered physical rooms in the selected category.
export async function getPhysicalRoomsService(params: PhysicalRoomParamsDto) {
    const category = await findRoomCategoryById(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    return findPhysicalRoomsByCategory(params.roomCategoryId);
}
