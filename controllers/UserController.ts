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
import {isEmail, validate} from "class-validator";
import chalk from "chalk";
import validator from "validator";

export class UserController implements CrudController {

    private cryptoService: CryptoService = new CryptoService();
    private userRepository: UserRepository = new UserRepository();

    create(req: Request, res: Response): void {
        const signUpRequest: SignUpRequest = req.body;
        let signUpResponse: SignUpResponse = { success: false };
        this.cryptoService.hashUserPassword(escape(signUpRequest.password)).then(hashedPassword => {
            const user = new User(validator.escape(signUpRequest.email), hashedPassword);
            user.roles.add(Role.Regular); // register user as regular
            validate(user).then(errors => {
                if (errors.length > 0) {
                    // IMPORTANT!! errors contain the user password, in production you never want to log passwords to the console
                    // In this case, the password is expected to be hashed on the client side, and the project is not meant to be for production
                    // there are just way too much potential security vulnerabilities in ap app like this, that it needs a comprehensive security audit
                    console.log("user validation failed at registration. errors: ", errors);
                    res.status(400) // bad request
                    .send(signUpResponse);
                } else {
                    this.userRepository.insertUser(user).then(id => {
                        signUpResponse.success = true;
                        signUpResponse.token = this.cryptoService.signJsonWebToken(id);
                        console.log(chalk.green('A new user has been registered successfully: ' + id))
                        res.status(201).send(signUpResponse);
                    }).catch(e => {
                        // the error is probably related to duplicate email
                        console.log(chalk.red(e));
                        res.status(400).send(signUpResponse);
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
        this.userRepository.getUser(validator.escape(loginRequest.email)).then((user) => {
            this.cryptoService.comparePasswordWithHash(validator.escape(loginRequest.password), user.password).then(match => {
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

    /**
     * Checks whether an email address is already registered by a user, and sends back a json response with a valid
     * property. If the email is not in use, valid will be true or false if it's used by someone else.
     * @param req
     * @param res
     */
    checkEmailUniqueness(req: Request, res: Response) {
        const resJson = {
            valid: true
        }
        const email: string = validator.escape(req.body.email);
        if (isEmail(email)) {
            this.userRepository.getUser(email).then(user => resJson.valid = !user)
            .catch(e => console.log(e))
            .finally(() => res.send(resJson));
        } else {
            resJson.valid = false;
            res.send(resJson);
        }
    }
}
