import {NextFunction, Request, Response} from "express";
import {Invalid} from "../models/jsonAPI/Invalid";
import {CryptoService} from "../services/CryptoService";
import {UserRepository} from "../repositories/UserRepository";
import chalk from "chalk";
import {Role} from "../enums/Role";
import {User} from "../models/User";

const cryptoService: CryptoService = new CryptoService();
const userRepository: UserRepository = new UserRepository();

/**
 * Checks if user is authenticated, and if so, calls the route handler. Also refreshes the jwt.
 */
export async function authGuard(req: Request, res: Response, next: NextFunction) {
    const jwt = req.header('Authorization')!.replace('Bearer ', '');
    const decryptedJwt: any = cryptoService.verifyJwt(jwt);
    if (decryptedJwt === undefined) {
        console.log(chalk.red('An an invalid jwt has been caught!'));
        authFailed(res)
    }
    try {
       const user = await userRepository.getUserById(decryptedJwt._id);
        // attaching the current user to the request object, so that the route handler can access it
        (req as any).user = user;
        // attaching a refresh token
        (req as any).refreshToken = cryptoService.signJsonWebToken(decryptedJwt._id);
        next();
    } catch(e) {
        authFailed(res);
    }
}

function authFailed(res: Response) {
    const errRes: Invalid = {
        error: 'Please authenticate yourself first'
    }
    res.status(401).send(errRes);
}

/**
 * Jwt refresher in case the route is not protected by authentication but the user happens to be logged in
 */
export function jwtRefresher(req: Request, res: Response, next: NextFunction) {
    const jwt = req.header('Authorization')?.replace('Bearer ', '');
    if (jwt != null) {
        const decryptedJwt: any = cryptoService.verifyJwt(jwt);
        if (decryptedJwt !== undefined) { // verification was successful
            (req as any).refreshToken = cryptoService.signJsonWebToken(decryptedJwt._id);
        } else {
            console.log(chalk.red('An an invalid jwt has been caught!'));
            // the middleware will still call next() as the jwtRefresher will only be used on routes that don't require
            // authentication, but we still want the logged in user to refresh his/her token.
        }
    }
    next();
}

/**
 * Role guard that checks if a user has a particular role
 */
export function roleGuard(role: Role, user: User) {
    return user.roles.has(role);
}
