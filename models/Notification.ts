import {IsEmail, IsNotEmpty, Length, MinLength} from "class-validator";

export class Notification {

    @IsEmail()
    @IsNotEmpty()
    adminEmail: string;

    @MinLength(1)
    @IsNotEmpty()
    title: string;

    @MinLength(1)
    @IsNotEmpty()
    description: string;

    constructor(adminEmail: string, title: string, description: string) {
        this.adminEmail = adminEmail;
        this.title = title;
        this.description = description;
    }



}
