import type { CreateDemoBookingRequestDTO } from "../dtos/create-demo-booking.dto.js";
import {
    BadRequestError,
    ConflictError,
    InternalServerError,
    NotFoundError,
} from "../utils/errors/app.error.js";
import type { RoomHoldResponse } from "../dtos/room-hold.dto.js";

const hotelServiceUrl = process.env.HOTEL_SERVICE_URL;

export async function createRoomHold(
    bookingId: string,
    params: CreateDemoBookingRequestDTO,
): Promise<RoomHoldResponse> {
    if (!hotelServiceUrl) {
        throw new InternalServerError("HOTEL_SERVICE_URL is not configured");
    }

    let response: Response;

    try {
        response = await fetch(`${hotelServiceUrl}/booking-holds`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                bookingId,
                roomCategoryId: params.roomCategoryId,
                startDate: params.checkIn,
                endDate: params.checkOut,
                roomsRequired: params.roomCount,
            }),
        });
    } catch {
        throw new InternalServerError("Unable to connect to HotelService");
    }

    let result: {
        message?: string;
        data?: RoomHoldResponse;
    };

    try {
        result = await response.json();
    } catch {
        throw new InternalServerError(
            "HotelService returned an invalid response",
        );
    }

    if (!response.ok) {
        const message = result.message ?? "Failed to create room hold";

        switch (response.status) {
            case 400:
                throw new BadRequestError(message);
            case 404:
                throw new NotFoundError(message);
            case 409:
                throw new ConflictError(message);
            default:
                throw new InternalServerError(message);
        }
    }

    if (!result.data) {
        throw new InternalServerError(
            "HotelService returned an invalid room hold response",
        );
    }

    return result.data;
}

export async function releaseRoomHold(bookingId: string): Promise<void> {
    if (!hotelServiceUrl) {
        throw new InternalServerError("HOTEL_SERVICE_URL is not configured");
    }

    let response: Response;

    try {
        response = await fetch(
            `${hotelServiceUrl}/booking-holds/${bookingId}`,
            {
                method: "DELETE",
            },
        );
    } catch {
        throw new InternalServerError(
            "Unable to connect to HotelService to release room hold",
        );
    }

    if (!response.ok) {
        throw new InternalServerError("Failed to release room hold");
    }
}
