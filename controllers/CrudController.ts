import {Request, Response} from "express";

/**
 * Should be implemented by the controller classes that want to serve typical CRUD operations.
 */
export interface CrudController {
    create(req: Request, res: Response): void;
    read(req: Request, res: Response): void;
    update(req: Request, res: Response): void;
    delete(req: Request, res: Response): void;
}
