/**
 * @file Controller RESTful Web service API for tuits resource
 */
import TuitDao from "../daos/TuitDao";
import Tuit from "../models/tuits/Tuit";
import {Express, NextFunction, Request, Response} from "express";
import TuitControllerI from "../interfaces/TuitControllerI";
import {
    EmptyTuitError, InvalidInputError,
    MediaContentExceedsLimitError, MultiTypeMediaError,
    NoPermissionError,
    NoSuchUserError
} from "../errors/CustomErrors";
import AuthenticationController from "./AuthenticationController";
import CloudinaryController from "./CloudinaryController";
import UserDao from "../daos/UserDao";
import {IMAGE_FIELD, IMAGE_LIMIT, MY, VIDEO_FIELD, VIDEO_LIMIT} from "../utils/constants";
import CloudinaryDao from "../daos/CloudinaryDao";

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
    private static cloudinaryDao: CloudinaryDao = CloudinaryDao.getInstance();

    /**
     * Creates singleton controller instance
     * @param {Express} app Express instance to declare the RESTful Web service
     * API
     * @return TuitController
     */
    public static getInstance = (app: Express): TuitController => {
        if (TuitController.tuitController === null) {
            TuitController.tuitController = new TuitController();
            app.get("/api/tuits", TuitController.tuitController.findAllTuits);
            app.get("/api/users/:uid/tuits", TuitController.tuitController.findAllTuitsByUser);
            app.get("/api/tuits/:tid", TuitController.tuitController.findTuitById);
            app.post("/api/users/:uid/tuits",
                upload.fields([{name: IMAGE_FIELD, maxCount: 6}, {name: VIDEO_FIELD, maxCount: 1}]),
                TuitController.tuitController.createTuitByUser);
            app.put("/api/users/:uid/tuits/:tid",
                upload.fields([{name: IMAGE_FIELD, maxCount: 6}, {name: VIDEO_FIELD, maxCount: 1}]),
                TuitController.tuitController.updateTuit);
            app.delete("/api/tuits/:tid", TuitController.tuitController.deleteTuit);
            app.delete("/api/tuits", TuitController.tuitController.deleteAllTuits);
            app.get("/api/users/:uid/tuits-with-media", TuitController.tuitController.findTuitsWithMediaByUser);
        }
        return TuitController.tuitController;
    }

    private constructor() {
    }

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
    findTuitById = (req: Request, res: Response, next: NextFunction) => {
        const tuitId = req.params.tid;
        if (!AuthenticationController.isValidId(tuitId)) {
            next(new InvalidInputError("Received invalid id"));
            return;
        }
        TuitController.tuitDao.findTuitById(tuitId)
            .then((tuit) => res.json(tuit))
            .catch(next);
    }

    /**
     * Retrieves all tuits from the database for a particular user and returns
     * an array of tuits.
     * @param {Request} req Represents request from client
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON arrays containing the tuit objects
     * @param {NextFunction} next Error handling
     */
    findAllTuitsByUser = async (req: Request, res: Response, next: NextFunction) => {
        let profile, userId;
        userId = req.params.uid;
        if (userId === MY) {
            try {
                profile = AuthenticationController.checkLogin(req);
                userId = profile._id;
            } catch (e) {
                next(e);
                return;
            }
        }
        if (!AuthenticationController.isValidId(userId)) {
            next(new InvalidInputError("Received invalid id"));
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
        if (!AuthenticationController.isValidId(userId)) {
            next(new InvalidInputError("Received invalid id"));
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
        const files = req.files;
        let media = {IMAGE_FIELD: [], VIDEO_FIELD: []};
        if (files) {
            if (IMAGE_FIELD in files && VIDEO_FIELD in files) {
                next(new MultiTypeMediaError());
                return;
            }
            try {
                // @ts-ignore
                media[IMAGE_FIELD] = await TuitController.cloudinaryDao.uploadMedia(files[IMAGE_FIELD], IMAGE_LIMIT);
                // @ts-ignore
                media[VIDEO_FIELD] = await TuitController.cloudinaryDao.uploadMedia(files[VIDEO_FIELD], VIDEO_LIMIT);
            } catch (e) {
                next(e);
                return;
            }
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
        if (!AuthenticationController.isValidId(userId) || !AuthenticationController.isValidId(tuitId)) {
            next(new InvalidInputError("Received invalid id"));
            return;
        }
        const userOwnsTuit = await TuitController.tuitDao.findTuitOwnedByUser(userId, tuitId);
        if (userOwnsTuit) {
            const files = req.files;
            // replace old media with new media
            let newTuit = req.body;
            let newImage = [];
            let newVideo = [];
            if (newTuit[IMAGE_FIELD]) {
                newImage = Array.isArray(newTuit[IMAGE_FIELD]) ? newTuit[IMAGE_FIELD] : [newTuit[IMAGE_FIELD]];
            }
            if (newTuit[VIDEO_FIELD]) {
                newVideo = Array.isArray(newTuit[VIDEO_FIELD]) ? newTuit[VIDEO_FIELD] : [newTuit[VIDEO_FIELD]];
            }
            // @ts-ignore
            const newImageCount = newImage.length + (files && IMAGE_FIELD in files ? files[IMAGE_FIELD].length : 0);
            // @ts-ignore
            const newVideoCount = newVideo.length + (files && VIDEO_FIELD in files ? files[VIDEO_FIELD].length : 0);
            // both image and video
            if (newImageCount > 0 && newVideoCount > 0) {
                next(new MediaContentExceedsLimitError());
                return;
            }
            // 6 images or 1 video
            if (newImageCount > IMAGE_LIMIT || newVideoCount > VIDEO_LIMIT) {
                next(new MediaContentExceedsLimitError());
                return;
            }
            const media = {IMAGE_FIELD: [], VIDEO_FIELD: []};
            if (files) {
                try {
                    // @ts-ignore
                    media[IMAGE_FIELD] = await TuitController.cloudinaryDao.uploadMedia(files[IMAGE_FIELD], IMAGE_LIMIT);
                    // @ts-ignore
                    media[VIDEO_FIELD] = await TuitController.cloudinaryDao.uploadMedia(files[VIDEO_FIELD], VIDEO_LIMIT);
                } catch (e) {
                    next(e);
                    return;
                }
            }
            // @ts-ignore
            newImage = Array.prototype.concat(newImage, media[IMAGE_FIELD]);
            // @ts-ignore
            newVideo = Array.prototype.concat(newVideo, media[VIDEO_FIELD]);
            newTuit = {...newTuit, image: newImage, video: newVideo};
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
        if (!AuthenticationController.isValidId(userId) || !AuthenticationController.isValidId(tuitId)) {
            next(new InvalidInputError("Received invalid id"));
            return;
        }
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
        if (!AuthenticationController.isValidId(userId)) {
            next(new InvalidInputError("Received invalid id"));
            return;
        }
        TuitController.tuitDao.findTuitsWithMediaByUser(userId)
            .then((tuits) => res.json(tuits))
            .catch(next);
    }

};
