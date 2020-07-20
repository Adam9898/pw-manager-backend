import express from "express";
import {UserController} from "../controllers/UserController";

const router = express.Router();
const userController = new UserController();

/* GET users listing. */
router.get('/',(req,res) => userController.read(req, res));

router.post('/', (req, res) => userController.create(req, res));

module.exports = router;
