import {CrudController} from "./CrudController";
import {Request, Response} from "express";
import {CryptoService} from "../services/CryptoService";
import {UserRepository} from "../repositories/UserRepository";
import {LoginRequest} from "../models/jsonAPI/LoginRequest";
import {LoginResponse} from "../models/jsonAPI/LoginResponse";
import {SignUpRequest} from "../models/jsonAPI/SignUpRequest";
import {SignUpResponse} from "../models/jsonAPI/SignUpResponse";
import {User} from "../models/User";
import {Role} from "../enums/Role";
import {validate} from "class-validator";
import chalk from "chalk";

export class UserController implements CrudController {

    private cryptoService: CryptoService = new CryptoService();
    private userRepository: UserRepository = new UserRepository();

    create(req: Request, res: Response): void {
        const signUpRequest: SignUpRequest = req.body;
        let signUpResponse: SignUpResponse = { success: false };
        this.cryptoService.hashUserPassword(signUpRequest.password).then(hashedPassword => {
            const user = new User(signUpRequest.email, hashedPassword);
            user.roles.add(Role.Regular); // register user as regular
            validate(user).then(errors => {
                if (errors.length > 0) {
                    console.log("user validation failed at registration. errors: ", errors);
                    res.status(400); // bad request
                    res.send(signUpResponse);
                } else {
                    this.userRepository.insertUser(user).then(id => {
                        signUpResponse.success = true;
                        signUpResponse.token = this.cryptoService.signJsonWebToken(id);
                        console.log(chalk.green('A new user has been registered successfully: ' + id))
                        res.send(signUpResponse);
                    }).catch(e => {
                        // the error is probably related to duplicate email
                        console.log(chalk.red(e));
                        res.send(signUpResponse);
                    });
                }
            })
        });
    }

    delete(req: Request, res: Response): void {
    }

    read(req: Request, res: Response): void {
        const loginRequest: LoginRequest = req.body;
        let loginResponse: LoginResponse = { success: false };
        this.userRepository.getUser(loginRequest.email).then((user) => {
            this.cryptoService.comparePasswordWithHash(loginRequest.password, user.password).then(match => {
                if (match) {
                    // password is correct
                    loginResponse.success = true;
                    loginResponse.token = this.cryptoService.signJsonWebToken(user.id!);
                    console.log('user logged in: ' + user.id);
                    res.send(loginResponse);
                } else {
                    console.log(chalk.red('Failed login attempt: password did not match with hashed version in db'));
                    res.send(loginResponse);
                }
            });
        })
        .catch(() => {
            loginResponse.success = false;
            console.log(chalk.red('Failed login attempt: email address not found'));
            res.send(loginResponse);
        });
    }

    update(req: Request, res: Response): void {
    }

    checkEmailUniqueness() {
        // todo check email uniqueness api endpoint
    }
}
