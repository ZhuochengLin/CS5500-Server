import {NextFunction, Request, Response} from "express";

export default interface UserControllerI {
    findAllUsers (req: Request, res: Response): void;
    findUserById (req: Request, res: Response, next: NextFunction): void;
    createUser (req: Request, res: Response, next: NextFunction): void;
    updateUser (req: Request, res: Response, next:NextFunction): void;
    deleteUser (req: Request, res: Response, next:NextFunction): void;
    deleteAllUsers (req: Request, res: Response, next: NextFunction): void;
};