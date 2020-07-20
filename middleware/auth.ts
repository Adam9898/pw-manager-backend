import {NextFunction, Request, Response} from "express";
import {Invalid} from "../models/jsonAPI/Invalid";
import {UserRepository} from "../repositories/UserRepository";
import chalk from "chalk";
import {Role} from "../enums/Role";
import {CryptoService} from "../services/CryptoService";


const cryptoService = new CryptoService();
const userRepository = new UserRepository();

/**
 * Checks if user is authenticated, and if so, calls the route handler. Also refreshes the jwt.
 */
export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
    const jwt = req.header('Authorization')!.replace('Bearer ', '');
    const decryptedJwt: any = cryptoService.verifyJwt(jwt);
    if (decryptedJwt === undefined) {
        console.log(chalk.red('An invalid jwt has been caught!'));
        authFailed(res)
    }
    try {
       const user = await userRepository.getUserById(decryptedJwt._id);
        // attaching the current user to the request object, so that the route handler can access it
        (req as any).user = user;
        // attaching a refresh token
        res.set('pw-manager-refresh-token', cryptoService.signJsonWebToken(decryptedJwt._id));
        next();
    } catch(e) {
        console.log(e);
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
            console.log(chalk.red('An invalid jwt has been caught!'));
            // the middleware will still call next() as the jwtRefresher will only be used on routes that don't require
            // authentication, but we still want the logged in user to refresh his/her token.
        }
    }
    next();
}

/**
 * Role guard that checks if a user has a particular role
 */
export function roleGuard(role: Role, req: any, res: Response, next: () => any) {
    if (req.user.roles.has(role)) {
        next();
    } else {
        const invalid: Invalid = {
            error: "You don't have the right roles to access this API endpoint"
        }
        res.status(401).send(invalid);
    }
}
