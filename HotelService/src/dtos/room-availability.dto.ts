// Describes one generated room-and-date record ready for insertion.
export type RoomAvailabilityInsertDto = {
    physicalRoomId: string;
    dateOfAvailability: string;
    price: number;
};
