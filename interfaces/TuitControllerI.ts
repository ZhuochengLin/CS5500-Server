import {NextFunction, Request, Response} from "express";
import Tuit from "../models/tuits/Tuit";

export default interface TuitControllerI {
    findAllTuits (req: Request, res: Response): void;
    findAllTuitsByUser (req: Request, res: Response, next: NextFunction): void;
    findTuitById (req: Request, res: Response, next: NextFunction): void;
    createTuitByUser (req: Request, res: Response, next: NextFunction): void;
    updateTuit (req: Request, res: Response, next: NextFunction): void;
    deleteTuit (req: Request, res: Response, next: NextFunction): void;
};