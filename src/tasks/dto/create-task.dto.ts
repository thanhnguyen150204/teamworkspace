import { TaskPriority, TaskStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

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

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    dueDate?: Date;

}
