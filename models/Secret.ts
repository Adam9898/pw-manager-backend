import {User} from "./User";
import {IsNotEmpty, IsNotEmptyObject, MaxLength} from "class-validator";

/**
 * A secret is a password field that is created and encrypted by the user on the client side. Other than the actual
 * password, it has a name, and a username field too.
 */
export class Secret {

    id?: string

    @MaxLength(20)
    @IsNotEmpty()
    name: string;

    @MaxLength(50)
    @IsNotEmpty()
    username: string;

    @MaxLength(250)
    @IsNotEmpty()
    password: string;

    @IsNotEmptyObject()
    @IsNotEmpty()
    user: User;


    constructor(name: string, username: string, password: string, user: User, id?: string) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.password = password;
        this.user = user;
    }
}
