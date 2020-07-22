import express from "express";
import {NotificationController} from "../controllers/NotificationController";
import {authGuard, roleGuard} from "../middleware/auth";
import {Role} from "../enums/Role";

const router = express.Router();
const notificationController = new NotificationController();

router.get('/subscribe', authGuard, (req, res) => {
    notificationController.subscribe(req, res);
})

router.post('/send', authGuard,
    (req, res, next) => roleGuard(Role.Admin, req, res, next),
    (req, res) => {
    notificationController.send(req, res);
})


export default router;
