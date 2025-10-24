import { IsIn, IsInt, IsString } from "class-validator";
export class UpdateStatusOrderDto{
    @IsInt()
    id: number

    @IsString()
    name: string

    @IsString()
    @IsIn(['PENDING', 'PROCESSED', 'CANCELLED'])
    status: string
}