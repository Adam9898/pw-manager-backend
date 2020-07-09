import express from "express";
import {UserController} from "../controllers/UserController";

const router = express.Router();

const userController = new UserController();

/* GET users listing. */
router.get('/users', (req, res, next) => {
    userController.read(req, res);
});

module.exports = router;
