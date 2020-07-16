import express from "express";
import {UserController} from "../controllers/UserController";

const router = express.Router();


/* GET users listing. */
router.get('/',(req,res) => {
    const userController = new UserController();
    userController.read(req, res);
});

router.post('/', (req, res) => {
   const userController = new UserController();
   userController.create(req, res);
});

module.exports = router;
