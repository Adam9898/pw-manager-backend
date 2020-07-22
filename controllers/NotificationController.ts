import {Request, Response} from "express";
import {Notification} from "../models/Notification";
import {validate} from "class-validator";
import {Invalid} from "../models/jsonAPI/Invalid";
import {EventEmitter} from "events";
import validator from 'validator';

export class NotificationController {

    private readonly SSE_HEADERS = {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no'
    }

    readonly eventEmitter = new EventEmitter();

    subscribe(req: Request, res: Response) {
        res.writeHead(200, this.SSE_HEADERS);
        console.log(`User ${(req as any).user.id} is now listening to notifications`);
        const notificationListener = (notification: Notification) => res.write(`event: ${JSON.stringify(notification)}\\n\\n`);
        this.eventEmitter.on('notifyUsers', notificationListener);
        res.on('close', () => this.eventEmitter.off('notifyUsers', notificationListener));
    }


    send(req: Request, res: Response) {
        const notification = new Notification((req as any).user.email, validator.escape(req.body.title), validator.escape(req.body.description));
        validate(notification).then((error) => {
            if (error.length > 0) {
                const invalid: Invalid = {
                    error: 'Validation of the notification data is failed.'
                }
                res.status(400).send(invalid)
            } else {
                this.eventEmitter.emit('notifyUsers', notification);
                res.status(200).end();
            }
        });
    }

}
