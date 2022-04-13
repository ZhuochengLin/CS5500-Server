/**
 * @file Controller RESTful Web service API for users resource
 */
import UserDao from "../daos/UserDao";
import User from "../models/users/User";
import {Express, NextFunction, Request, Response} from "express";
import UserControllerI from "../interfaces/UserControllerI";
import AuthenticationController from "./AuthenticationController";
import {InvalidInputError, NoPermissionError, UserAlreadyExistsError} from "../errors/CustomErrors";
import {HEADER_IMAGE_FIELD, MY, PROFILE_PHOTO_FIELD} from "../utils/constants";
import CloudinaryController from "./CloudinaryController";
import CloudinaryDao from "../daos/CloudinaryDao";

const multer = require("multer");
const memoStorage = multer.memoryStorage();
const upload = multer({storage: memoStorage});

const ObjectId = require('mongoose').Types.ObjectId;

/**
 * @class UserController Implements RESTful Web service API for users resource.
 * Defines the following HTTP endpoints:
 * <ul>
 *     <li>POST /api/users to create a new user instance</li>
 *     <li>GET /api/users to retrieve all the user instances</li>
 *     <li>GET /api/users/:uid to retrieve an individual user instance </li>
 *     <li>PUT /api/users to modify an individual user instance </li>
 *     <li>DELETE /api/users/:uid to remove a particular user instance</li>
 * </ul>
 * @property {UserDao} userDao Singleton DAO implementing user CRUD operations
 * @property {UserController} userController Singleton controller implementing
 * RESTful Web service API
 */
export default class UserController implements UserControllerI {
    private static userDao: UserDao = UserDao.getInstance();
    private static userController: UserController | null = null;
    private static cloudinaryDao: CloudinaryDao = CloudinaryDao.getInstance();

    /**
     * Creates singleton controller instance
     * @param {Express} app Express instance to declare the RESTful Web service
     * API
     * @returns UserController
     */
    public static getInstance = (app: Express): UserController => {
        if(UserController.userController === null) {
            UserController.userController = new UserController();
            app.get("/api/users",
                UserController.userController.findAllUsers);
            app.get("/api/users/:uid",
                UserController.userController.findUserById);
            app.post("/api/users",
                UserController.userController.createUser);
            app.put("/api/users/:uid",
                upload.fields([{name: HEADER_IMAGE_FIELD, maxCount: 1}, {name: PROFILE_PHOTO_FIELD, maxCount: 1}]),
                UserController.userController.updateUser);
            app.delete("/api/users/:uid",
                UserController.userController.deleteUser);
            app.delete("/api/users",
                UserController.userController.deleteAllUsers);
        }
        return UserController.userController;
    }

    private constructor() {}

    /**
     * Retrieves all users from the database and returns an array of users.
     * @param {Request} req Represents request from client
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON arrays containing the user objects
     */
    findAllUsers = (req: Request, res: Response) =>
        UserController.userDao.findAllUsers()
            .then((users: User[]) => res.json(users));

    /**
     * Retrieves the user by their primary key
     * @param {Request} req Represents request from client, including path
     * parameter uid identifying the primary key of the user to be retrieved
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON containing the user that matches the user ID
     * @param {NextFunction} next Error handling
     */
    findUserById = (req: Request, res: Response, next: NextFunction) => {
        const userId = req.params.uid;
        if (!ObjectId.isValid(userId)) {
            next(new InvalidInputError("Received invalid id"));
            return;
        }
        UserController.userDao.findUserById(userId)
            .then((user) => res.json(user))
            .catch(next);
    }
    
    /**
     * Creates a new user instance
     * @param {Request} req Represents request from client, including body
     * containing the JSON object for the new user to be inserted in the
     * database
     * @param {Response} res Represents response to client, including the
     * body formatted as JSON containing the new user that was inserted in the
     * database
     * @param {NextFunction} next Error handling
     */
    createUser = async (req: Request, res: Response, next: NextFunction) => {
        let profile;
        try {
            profile = AuthenticationController.checkLogin(req);
        } catch (e) {
            next(e);
            return
        }
        const isAdmin = await AuthenticationController.isAdmin(profile.username);
        if (isAdmin) {
            UserController.userDao.createUser(req.body)
                .then((user: User) => res.json(user))
                .catch(next);
        } else {
            next(new NoPermissionError());
            return
        }
    }
    
    /**
     * Modifies an existing user instance
     * @param {Request} req Represents request from client, including path
     * parameter uid identifying the primary key of the user to be modified
     * @param {Response} res Represents response to client, including status
     * on whether updating a user was successful or not
     * @param {NextFunction} next Error handling
     */
    updateUser = async (req: Request, res: Response, next: NextFunction) => {
        let userId, profile;
        try {
            profile = AuthenticationController.checkLogin(req);
            userId = await AuthenticationController.getUserId(req, profile);
        } catch (e) {
            next(e)
            return;
        }
        if (userId === MY) {
            next(new InvalidInputError("Cannot update admin account."))
            return;
        }
        if (!ObjectId.isValid(userId)) {
            next(new InvalidInputError("Received invalid id"));
            return;
        }
        const data = req.body;
        // duplicate username
        if (data.username) {
            const existingUser = await UserController.userDao.findUserByUsername(data.username);
            if (existingUser && existingUser._id.toString() !== userId) {
                next(new UserAlreadyExistsError());
                return;
            }
        }
        const files = req.files;
        let headerImage = null;
        let profilePhoto = null;
        if (files) {
            // @ts-ignore
            headerImage = await UserController.cloudinaryDao.uploadMedia(files[HEADER_IMAGE_FIELD], 1);
            headerImage = headerImage.length > 0 ? headerImage[0] : null;
            // @ts-ignore
            profilePhoto = await UserController.cloudinaryDao.uploadMedia(files[PROFILE_PHOTO_FIELD], 1);
            profilePhoto = profilePhoto.length > 0 ? profilePhoto[0] : null;
        }
        data[HEADER_IMAGE_FIELD] = headerImage ? headerImage : data[HEADER_IMAGE_FIELD];
        data[PROFILE_PHOTO_FIELD] = profilePhoto ? profilePhoto : data[PROFILE_PHOTO_FIELD];
        UserController.userDao.updateUser(userId, data)
            .then((status) => res.send(status)).catch(next);
    }
    
    /**
     * Removes a user instance from the database
     * @param {Request} req Represents request from client, including path
     * parameter uid identifying the primary key of the user to be removed
     * @param {Response} res Represents response to client, including status
     * on whether deleting a user was successful or not
     * @param {NextFunction} next Error handling
     */
    deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        let profile;
        try {
            profile = AuthenticationController.checkLogin(req);
        } catch (e) {
            next(e);
            return
        }
        const isAdmin = await AuthenticationController.isAdmin(profile.username);
        const userId = req.params.uid;
        if (userId === MY) {
            next(new InvalidInputError("Cannot delete admin account."))
            return;
        }
        if (isAdmin) {
            if (!ObjectId.isValid(userId)) {
                next(new InvalidInputError("Received invalid id"));
                return;
            }
            UserController.userDao.deleteUser(userId)
                .then((status) => res.send(status))
                .catch(next);
        } else {
            next(new NoPermissionError());
        }
    }
    
    /**
     * Removes all user instances from the database. Useful for testing
     * @param {Request} req Represents request from client 
     * @param {Response} res Represents response to client, including status
     * on whether deleting all users was successful or not
     * @param {NextFunction} next Error handling
     */
    deleteAllUsers = async (req: Request, res: Response, next: NextFunction) => {
        let profile;
        try {
            profile = AuthenticationController.checkLogin(req);
        } catch (e) {
            next(e);
            return
        }
        const isAdmin = await AuthenticationController.isAdmin(profile.username);
        if (isAdmin) {
            UserController.userDao.deleteAllUsers()
                .then((status) => res.send(status));
        } else {
            next(new NoPermissionError());
        }
    }
};
