import {CrudController} from "./CrudController";
import {Request, Response} from "express";

export class UserController implements CrudController {

    create(req: Request, res: Response): void {
    }

    delete(req: Request, res: Response): void {
    }

    read(req: Request, res: Response): void {
        res.json({
            hello: 'hello worlds'
        });
    }

    update(req: Request, res: Response): void {
    }

}
