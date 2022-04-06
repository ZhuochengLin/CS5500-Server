/**
 * @file Controller RESTful Web service API for tuits resource
 */
import TuitDao from "../daos/TuitDao";
import Tuit from "../models/tuits/Tuit";
import {Express, NextFunction, Request, Response} from "express";
import TuitControllerI from "../interfaces/TuitControllerI";
import {
    EmptyTuitError, InvalidInputError,
    MediaContentExceedsLimitError,
    NoPermissionError,
    NoSuchTuitError,
    NoSuchUserError
} from "../errors/CustomErrors";
import AuthenticationController from "./AuthenticationController";
import CloudinaryController from "./CloudinaryController";
import UserDao from "../daos/UserDao";
import {IMAGE_FIELD, MY, VIDEO_FIELD} from "../utils/constants";

const multer = require("multer");
const memoStorage = multer.memoryStorage();
const upload = multer({storage: memoStorage});

/**
 * @class TuitController Implements RESTful Web service API for tuits resource.
 * Defines the following HTTP endpoints:
 * <ul>
 *     <li>POST /api/users/:uid/tuits to create a new tuit instance for
 *     a given user</li>
 *     <li>GET /api/tuits to retrieve all the tuit instances</li>
 *     <li>GET /api/tuits/:tid to retrieve a particular tuit instances</li>
 *     <li>GET /api/users/:uid/tuits to retrieve tuits for a given user </li>
 *     <li>PUT /api/tuits/:tid to modify an individual tuit instance </li>
 *     <li>DELETE /api/tuits/:tid to remove a particular tuit instance</li>
 * </ul>
 * @property {TuitDao} tuitDao Singleton DAO implementing tuit CRUD operations
 * @property {TuitController} tuitController Singleton controller implementing
 * RESTful Web service API
 */
export default class TuitController implements TuitControllerI {

    private static userDao: UserDao = UserDao.getInstance();
    private static tuitDao: TuitDao = TuitDao.getInstance();
    private static tuitController: TuitController | null = null;
    private static cloudinaryController: CloudinaryController = CloudinaryController.getInstance();

    /**
     * Creates singleton controller instance
     * @param {Express} app Express instance to declare the RESTful Web service
     * API
     * @return TuitController
     */
    public static getInstance = (app: Express): TuitController => {
        if(TuitController.tuitController === null) {
            TuitController.tuitController = new TuitController();
            app.get("/api/tuits", TuitController.tuitController.findAllTuits);
            app.get("/api/users/:uid/tuits", TuitController.tuitController.findAllTuitsByUser);
            app.get("/api/tuits/:tid", TuitController.tuitController.findTuitById);
            app.post("/api/users/:uid/tuits",
                upload.fields([{name: "image", maxCount: 6}, {name: "video", maxCount: 1}]),
                TuitController.tuitController.createTuitByUser);
            app.put("/api/users/:uid/tuits/:tid",
                upload.fields([{name: "image", maxCount: 6}, {name: "video", maxCount: 1}]),
                TuitController.tuitController.updateTuit);
            app.delete("/api/tuits/:tid", TuitController.tuitController.deleteTuit);
            app.delete("/api/tuits", TuitController.tuitController.deleteAllTuits);
            app.get("/api/users/:uid/tuits-with-media", TuitController.tuitController.findTuitsWithMediaByUser);
        }
        return TuitController.tuitController;
    }

    private constructor() {}

    /**
     * Retrieves all tuits from the database and returns an array of tuits.
     * @param {Request} req Represents request from client
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON arrays containing the tuit objects
     */
    findAllTuits = (req: Request, res: Response) =>
        TuitController.tuitDao.findAllTuits()
            .then((tuits: Tuit[]) => res.json(tuits));
    
    /**
     * @param {Request} req Represents request from client, including path
     * parameter tid identifying the primary key of the tuit to be retrieved
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON containing the tuit that matches the user ID
     * @param {NextFunction} next Error handling
     */
    findTuitById = (req: Request, res: Response, next: NextFunction) =>
        TuitController.tuitDao.findTuitById(req.params.tid)
            .then((tuit) => res.json(tuit))
            .catch(next);

    /**
     * Retrieves all tuits from the database for a particular user and returns
     * an array of tuits.
     * @param {Request} req Represents request from client
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON arrays containing the tuit objects
     * @param {NextFunction} next Error handling
     */
    findAllTuitsByUser = async (req: Request, res: Response, next: NextFunction) => {
        let userId, profile;
        try {
            profile = AuthenticationController.checkLogin(req);
            userId = await AuthenticationController.getUserId(req, profile);
        } catch (e) {
            next(e)
            return;
        }
        if (userId === MY) {
            next(new InvalidInputError("Admin account does not have tuits"));
            return;
        }
        TuitController.tuitDao.findAllTuitsByUser(userId)
            .then((tuits: Tuit[]) => res.json(tuits))
            .catch(next);
    }

    /**
     * @param {Request} req Represents request from client, including body
     * containing the JSON object for the new tuit to be inserted in the
     * database
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON containing the new tuit that was inserted in the
     * database
     * @param {NextFunction} next Error handling
     */
    createTuitByUser = async (req: Request, res: Response, next: NextFunction) => {
        let userId, profile;
        try {
            profile = AuthenticationController.checkLogin(req);
            userId = await AuthenticationController.getUserId(req, profile);
        } catch (e) {
            next(e)
            return;
        }
        if (userId === MY) {
            next(new InvalidInputError("Admin account cannot create tuit"));
            return;
        }
        const existingUser = await TuitController.userDao.findUserById(userId);
        if (!existingUser) {
            next(new NoSuchUserError());
            return;
        }
        const tuit = req.body;
        if (!tuit.tuit) {
            next(new EmptyTuitError());
            return;
        }
        let media;
        try {
            media = await TuitController.cloudinaryController.uploadMedia(req);
        } catch (e) {
            next(e);
            return
        }
        TuitController.tuitDao.createTuitByUser(userId, {...tuit, ...media})
            .then((tuit: Tuit) => res.json(tuit))
            .catch(next);
    }

    /**
     * @param {Request} req Represents request from client, including path
     * parameter tid identifying the primary key of the tuit to be modified
     * @param {Response} res Represents response to client, including status
     * on whether updating a tuit was successful or not
     * @param {NextFunction} next Error handling
     */
    updateTuit = async (req: Request, res: Response, next: NextFunction) => {
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
        const userOwnsTuit = await TuitController.tuitDao.findTuitOwnedByUser(userId, tuitId);
        if (userOwnsTuit) {
            let media;
            try {
                media = await TuitController.cloudinaryController.uploadMedia(req);
            } catch (e) {
                next(e);
                return
            }
            // replace old media with new media
            let newTuit = req.body;
            // only update media when request has media fields
            if (IMAGE_FIELD in newTuit || VIDEO_FIELD in newTuit) {
                let newImage = newTuit.image ? newTuit.image : [];
                let newVideo = newTuit.video ? newTuit.image : [];
                newImage = Array.prototype.concat(newImage, media.image);
                newVideo = Array.prototype.concat(newVideo, media.video);
                // both image and video
                if (newImage.length > 0 && newVideo.length > 0) {
                    next(new MediaContentExceedsLimitError());
                    return;
                }
                // 6 images or 1 video
                if (newImage.length > 6 || newVideo.length > 1) {
                    next(new MediaContentExceedsLimitError());
                    return;
                }
                newTuit = {...newTuit, image: newImage, video: newVideo};
            }
            TuitController.tuitDao.updateTuit(tuitId, newTuit)
                .then((status) => res.send(status))
                .catch(next);
        } else {
            next(new NoPermissionError());
        }
    }

    /**
     * @param {Request} req Represents request from client, including path
     * parameter tid identifying the primary key of the tuit to be removed
     * @param {Response} res Represents response to client, including status
     * on whether deleting a user was successful or not
     * @param {NextFunction} next Error handling
     */
    deleteTuit = async (req: Request, res: Response, next: NextFunction) => {
        let profile;
        try {
            profile = AuthenticationController.checkLogin(req);
        } catch (e) {
            next(e)
            return;
        }
        const tuitId = req.params.tid;
        const userId = profile._id;
        const isAdmin = await AuthenticationController.isAdmin(profile.username);
        if (isAdmin) {
            TuitController.tuitDao.deleteTuit(tuitId)
                .then((status) => res.send(status))
                .catch(next);
        } else {
            const userOwnsTuit = await TuitController.tuitDao.findTuitOwnedByUser(userId, tuitId);
            if (userOwnsTuit) {
                TuitController.tuitDao.deleteTuit(req.params.tid)
                    .then((status) => res.send(status))
                    .catch(next);
            } else {
                next(new NoPermissionError());
            }
        }
    }

    deleteAllTuits = async (req: Request, res: Response, next: NextFunction) => {
        let profile;
        try {
            profile = AuthenticationController.checkLogin(req);
        } catch (e) {
            next(e);
            return
        }
        const isAdmin = await AuthenticationController.isAdmin(profile.username);
        if (isAdmin) {
            TuitController.tuitDao.deleteAllTuits()
                .then((status) => res.json(status));
        } else {
            next(new NoPermissionError());
        }
    }

    findTuitsWithMediaByUser = async (req: Request, res: Response, next: NextFunction) => {
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
        TuitController.tuitDao.findTuitsWithMediaByUser(userId)
            .then((tuits) => res.json(tuits))
            .catch(next);
    }

};
