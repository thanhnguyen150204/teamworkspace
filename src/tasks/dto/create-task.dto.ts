import { TaskPriority, TaskStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status: TaskStatus;
    
    @IsEnum(TaskPriority)
    @IsOptional()
    priority: TaskPriority;

    @IsDateString()
    @IsOptional()
    dueDate?: Date;

}
