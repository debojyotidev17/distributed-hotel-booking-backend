import type { Request, Response } from "express";
import type {
    CreateRoomCategoryDto,
    RoomCategoryHotelIdDto,
    RoomCategoryParamsDto,
    UpdateRoomCategoryDto,
} from "../dtos/room-category.dto.js";
import {
    createRoomCategoryService,
    deleteRoomCategoryService,
    getRoomCategoriesByHotelIdService,
    getRoomCategoryByIdService,
    updateRoomCategoryService,
} from "../services/room-category.service.js";

// Creates a category under the hotel in the route.
export async function createRoomCategoryHandler(req: Request, res: Response) {
    const category = await createRoomCategoryService(
        req.params.hotelId as RoomCategoryHotelIdDto,
        req.body as CreateRoomCategoryDto,
    );

    return res.status(201).json({
        success: true,
        message: "Room category created successfully",
        data: category,
    });
}

// Lists the categories belonging to the hotel in the route.
export async function getRoomCategoriesHandler(req: Request, res: Response) {
    const categories = await getRoomCategoriesByHotelIdService(
        req.params.hotelId as RoomCategoryHotelIdDto,
    );

    return res.status(200).json({
        success: true,
        message: "Room categories retrieved successfully",
        data: categories,
    });
}

// Gets one category belonging to the hotel in the route.
export async function getRoomCategoryByIdHandler(req: Request, res: Response) {
    const category = await getRoomCategoryByIdService(
        req.params as unknown as RoomCategoryParamsDto,
    );

    return res.status(200).json({
        success: true,
        message: "Room category retrieved successfully",
        data: category,
    });
}

// Updates one category belonging to the hotel in the route.
export async function updateRoomCategoryHandler(req: Request, res: Response) {
    const category = await updateRoomCategoryService(
        req.params as unknown as RoomCategoryParamsDto,
        req.body as UpdateRoomCategoryDto,
    );

    return res.status(200).json({
        success: true,
        message: "Room category updated successfully",
        data: category,
    });
}

// Permanently deletes one category belonging to the hotel in the route.
export async function deleteRoomCategoryHandler(req: Request, res: Response) {
    const category = await deleteRoomCategoryService(
        req.params as unknown as RoomCategoryParamsDto,
    );

    return res.status(200).json({
        success: true,
        message: "Room category deleted successfully",
        data: category,
    });
}
