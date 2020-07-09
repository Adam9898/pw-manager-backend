import {IsEmail, IsNotEmpty, MaxLength, MinLength} from "class-validator";
import {Role} from "../enums/Role";

export class User {

    id?: string;

    @MaxLength(50)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @MaxLength(40)
    @MinLength(8)
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

    /**
     * @param password
     * setter method that hashes the password
     */
    set password(password: string) {
        // todo crypto
        this._password = password;
    }
}
