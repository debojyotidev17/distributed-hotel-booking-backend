import { GENERATE_AVAILABILITY_JOB_NAME } from "../constants/queue-name.constant.js";
import type { RoomGenerationJobDto } from "../dtos/room-generation.dto.js";
import { roomGenerationQueue } from "../queues/room-generation.queue.js";

// Adds one period-and-date-range job to the generation queue.
export async function addRoomGenerationJobToQueue(
    data: RoomGenerationJobDto,
){
    return roomGenerationQueue.add(GENERATE_AVAILABILITY_JOB_NAME, data);
}
