import express from "express";
import {UserController} from "../controllers/UserController";

const router = express.Router();
const userController = new UserController();


router.post('/login',(req,res) => userController.read(req, res));

router.post('/', (req, res) => userController.create(req, res));

router.post('/check-email', (req, res) => userController.checkEmailUniqueness(req, res))

export default router;
