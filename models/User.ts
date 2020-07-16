import {IsEmail, IsNotEmpty, MaxLength} from "class-validator";
import {Role} from "../enums/Role";

export class User {

    id?: string;

    @MaxLength(50)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    private _password: string;

    constructor(email: string, password: string, roles?: Set<Role>) {
        this.email = email;
        this._password = password;
    }


    get password(): string {
        return this._password;
    }

    roles = new Set<Role>();

    set password(password: string) {
        this._password = password;
    }
}
