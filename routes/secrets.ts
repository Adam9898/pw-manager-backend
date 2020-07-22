import express from "express";
import {authGuard, roleGuard} from "../middleware/auth";
import {Role} from "../enums/Role";
import {SecretsController} from "../controllers/SecretsController";

const router = express.Router();

/**
 * ******************************************** !!!!IMPORTANT!!!! *****************************************************
 * There are no middleware for checking if the user provided secret id is actually attached to a secret
 * that he/she owns. This functionality is included in the repository, which will filter for the user id that the auth token has.
 * This way, if a user sends a request to the secrets API with someone else's secret id, the repository won't execute.
 */

const secretController = new SecretsController();

router.post('/', authGuard,
    (req, res, next) => roleGuard(Role.Regular, req, res, next),
    (req, res) => secretController.create(req, res)
);

router.delete('/:secretId', authGuard,
    (req, res, next) => roleGuard(Role.Regular, req, res, next),
    (req, res) => secretController.delete(req, res)
);

router.get('/:secretId', authGuard,
    (req, res, next) => roleGuard(Role.Regular, req, res, next),
    (req, res) => secretController.read(req, res)
);

router.put('/', authGuard,
    (req, res, next) => roleGuard(Role.Regular, req, res, next),
    (req, res) => secretController.update(req, res)
);

router.get('/', authGuard,
    (req, res, next) => roleGuard(Role.Regular, req, res, next),
    (req, res) => secretController.list(req, res)
);

export default router;
