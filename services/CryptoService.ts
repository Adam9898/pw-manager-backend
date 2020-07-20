import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import chalk from "chalk";

export class CryptoService {

    /**
     *  Uses a bcrypt javascript library to hash and salt the password. Ideally, the password should be hashed on the
     *  client side as well, so that there is no way that the server could possibly log the plain password before it gets hashed.
     *  One big benefit of hashing the password on the server too, is that the database admins can't authorize themselves
     *  as someone else. If the password would only be hashed on the client side, the db admin could just get the user's
     *  hashed password and use that to log into the account.
     *
     *  It is important to use a a different algorithm to derive the vault key, so that the password that gets hashed with bcrypt
     *  won't match the derived vault key. There are several ways password managers achieve this. In our case, we'll use
     *  a different hash function to derive the vault key from the password. But there are even more secure ways to do it,
     *  such as using the vault key, combine in it with the plain password and email, hash it, and then send it to the server etc...
     *  In the last case, the same hash function could be used.
     *
     *  In our case, as fas as I understand, if the password gets hashed with bcrypt to store it in the database for auth
     *  purposes, and PBKDF2 is used to derive the vault key from the password, than the hashed strings should differ,
     *  therefore the server admins wouldn't be able to decrypt the encrypted vault, as they only have access to
     *  a different hash than what is used as an AES key (the derived vault key).
     *
     *  Feel free to send me a message, if you think this is not correct, in the end of the day I'm not a cyber security
     *  expert (yet :) ), and this is just a hobby project.
     *
     */
    async hashUserPassword(password: string) {
        const salt = await bcrypt.genSalt(14);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    async comparePasswordWithHash(password: string, hash: string) {
        const returnVal = await bcrypt.compare(password, hash);
        return returnVal;
    }

    signJsonWebToken(userId: string) {
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error('json web token secret key is not specified in an environment variable');
        }
        return jwt.sign({ _id: userId }, process.env.JWT_SECRET_KEY, { expiresIn: '10 minutes' });
    }

    /**
     * Wrapper method around verifying jwt tokens. If token is valid, the decrypted token will be returned, or
     * undefined otherwise.
     */
    verifyJwt(token: string): string | object | undefined {
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error('json web token secret key is not specified in an environment variable');
        }
        let decryptedToken = undefined;
        try {
            decryptedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (e) {
            console.log(chalk.red('jwt verification failed: ' + e));
        }
        return decryptedToken;
    }
}
