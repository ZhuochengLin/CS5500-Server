import LikeDao from "../daos/LikeDao";
import {Express, NextFunction, Request, Response} from "express";
import AuthenticationController from "./AuthenticationController";
import TuitDao from "../daos/TuitDao";
import {InvalidInputError, NoSuchTuitError} from "../errors/CustomErrors";
import {MY} from "../utils/constants";

export default class LikeController {

    private static likeController: LikeController | null = null;
    private static likeDao: LikeDao = LikeDao.getInstance();
    private static tuitDao: TuitDao = TuitDao.getInstance();

    private constructor() {
    }

    public static getInstance = (app: Express) => {
        if (LikeController.likeController === null) {
            LikeController.likeController = new LikeController();
            app.get("/api/likes", LikeController.likeController.findAllLikes);
            app.get("/api/users/:uid/likes", LikeController.likeController.findAllTuitsLikedByUser);
            app.put("/api/users/:uid/likes/:tid", LikeController.likeController.userTogglesLikesTuit);
        }
        return LikeController.likeController;
    }

    userTogglesLikesTuit = async (req: Request, res: Response, next: NextFunction) => {
        let userId, profile;
        try {
            profile = AuthenticationController.checkLogin(req);
            userId = await AuthenticationController.getUserId(req, profile);
        } catch (e) {
            next(e)
            return;
        }
        if (userId === MY) {
            next(new InvalidInputError("Admin account does not have tuits."));
            return;
        }
        const tuitId = req.params.tid;
        const tuit = await LikeController.tuitDao.findTuitById(tuitId);
        if (!tuit) {
            next(new NoSuchTuitError());
            return;
        }
        const userAlreadyLikedTuit = await LikeController.likeDao.findUserAlreadyLikedTuit(userId, tuitId);
        if (userAlreadyLikedTuit) {
            await LikeController.likeDao.userUnlikesTuit(userId, tuitId).catch(next);
        } else {
            await LikeController.likeDao.userLikesTuit(userId, tuitId).catch(next);
        }
        tuit.stats.likes = await LikeController.likeDao.findHowManyLikedTuit(tuitId);
        await LikeController.tuitDao.updateTuit(tuitId, tuit);
        res.sendStatus(200);
    }

    findAllTuitsLikedByUser = async (req: Request, res: Response, next: NextFunction) => {
        let userId, profile;
        try {
            profile = AuthenticationController.checkLogin(req);
            userId = await AuthenticationController.getUserId(req, profile);
        } catch (e) {
            next(e)
            return;
        }
        if (userId === MY) {
            next(new InvalidInputError("Admin account does not have tuits."));
            return;
        }
        LikeController.likeDao.findAllTuitsLikedByUser(userId)
            .then((likes) => {
                const tuits = likes.map((like) => like.tuit);
                res.json(tuits);
            }).catch(next)
    }

    findAllLikes = async (req: Request, res: Response, next: NextFunction) => {
        LikeController.likeDao.findAllLikes().then((likes) => res.json(likes)).catch(next);
    }



}