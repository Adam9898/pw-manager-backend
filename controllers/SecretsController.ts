import {CrudController} from "./CrudController";
import {Request, Response} from "express";
import {Secret} from "../models/Secret";
import {validate, validateSync} from "class-validator";
import {SecretRepository} from "../repositories/SecretRepository";
import validator from 'validator';

export class SecretsController implements CrudController {

    private secretRepository = new SecretRepository();

    create(req: Request, res: Response): void {
        const secret = new Secret(validator.escape(req.body.name), validator.escape(req.body.username), validator.escape(req.body.password));
        const userId = (req as any).user.id;
        const validationErrors = validateSync(secret);
        if (validationErrors.length < 1) {
            this.secretRepository.insertSecret(secret, userId).then(() => res.status(201))
                .catch(e => res.status(500))
                .finally(() => res.end());
        } else {
            res.status(400).end();
        }
    }

    delete(req: Request, res: Response): void {
        const userId = (req as any).user.id;
        const secretId = validator.escape(req.params.secretId);
        this.secretRepository.deleteSecret(userId, secretId)
            .then(() => res.status(200))
            .catch(e => res.status(500))
            .finally(() => res.end());
    }

    read(req: Request, res: Response): void {
        const userId = (req as any).user.id;
        const secretId = validator.escape(req.params.secretId);
        this.secretRepository.getSecret(userId, secretId)
            .then(secret => res.send(secret))
            .catch(e => {
                console.log(e);
                res.status(500).end();
            });
    }

    update(req: Request, res: Response): void {
        const userId = (req as any).user.id;
        const secret = new Secret(validator.escape(req.body.name), validator.escape(req.body.username), validator.escape(req.body.password), validator.escape(req.body._id));
        validate(secret).then(validationErrors => {
           if (validationErrors.length > 0) {
               res.status(400).end();
               return;
           }
        })
        .then(() => {
            res.status(200);
            return this.secretRepository.updateSecret(userId, secret);
        })
        .catch(e => {
            console.log(e);
            res.status(500);
        })
        .finally(() => res.end());
    }

    list(req: Request, res: Response): void {
        const userId = (req as any).user.id;
        this.secretRepository.getSecretsNamesAndIds(userId).then(result => {
            res.send(result);
        })
        .catch(e => {
            console.log(e);
            res.status(500).end();
        });
    }

}
