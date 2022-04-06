import {Express, NextFunction, Request, Response} from "express";
import UserDao from "../daos/UserDao";
import {
    UserAlreadyExistsError,
    InvalidInputError,
    NoSuchUserError,
    NoUserLoggedInError,
    IncorrectCredentialError
} from "../errors/CustomErrors";
import AdminDao from "../daos/AdminDao";
import User from "../models/users/User";

const bcrypt = require('bcrypt');

export default class AuthenticationController {

    private static authenticationController: AuthenticationController | null = null;
    private static userDao: UserDao = UserDao.getInstance();
    private static adminDao: AdminDao = AdminDao.getInstance();

    public static getInstance = (app: Express) => {
        if (AuthenticationController.authenticationController === null) {
            AuthenticationController.authenticationController = new AuthenticationController();
            app.post("/api/auth/login", AuthenticationController.authenticationController.login);
            app.post("/api/auth/register", AuthenticationController.authenticationController.register);
            app.post("/api/auth/profile", AuthenticationController.authenticationController.profile);
            app.post("/api/auth/logout", AuthenticationController.authenticationController.logout);
        }
        return AuthenticationController.authenticationController;
    }

    login = async (req: Request, res: Response, next: NextFunction) => {

        console.log("==> login")
        console.log("==> req.session")
        console.log(req.session)

        const user = req.body;
        if (!user.username || !user.password) {
            next(new IncorrectCredentialError());
            return;
        }
        const username = user.username;
        const password = user.password;
        const existingUser = await AuthenticationController.userDao
            .findUserByUsername(username);
        if (!existingUser) {
            next(new IncorrectCredentialError())
            return;
        }
        const match = await bcrypt.compare(password, existingUser.password);
        if (match) {
            existingUser.password = '******';
            // @ts-ignore
            req.session['profile'] = existingUser;
            res.json(existingUser);
        } else {
            next(new IncorrectCredentialError());
        }
    }

    register = async (req: Request, res: Response, next: NextFunction) => {
        console.log("==> register")
        console.log("==> req.session")
        console.log(req.session)

        const newUser = req.body;
        if (!newUser.username || !newUser.password) {
            next(new InvalidInputError("No username or password"));
            return
        }
        const existingUser = await AuthenticationController.userDao
            .findUserByUsername(req.body.username);
        if (existingUser) {
            next(new UserAlreadyExistsError());
            return;
        }
        const insertedUser = await AuthenticationController.userDao
            .createUser(newUser);
        insertedUser.password = '******';
        // @ts-ignore
        req.session['profile'] = insertedUser;
        res.json(insertedUser);
    }

    profile = (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        const profile = req.session['profile'];
        if (profile) {
            res.json(profile);
        } else {
            next(new NoUserLoggedInError());
        }
    }

    logout = (req: Request, res: Response) => {
        // @ts-ignore
        req.session.destroy();
        res.sendStatus(200);
    }

    public static checkLogin = (req: Request): User => {
        // @ts-ignore
        const profile = req.session["profile"];
        if (!profile) {
            throw new NoUserLoggedInError();
        }
        return profile;
    }

    public static getUserId = async (req: Request, profile: User): Promise<string> => {
        const isAdmin = await AuthenticationController.adminDao.findAdmin(profile.username);
        if (isAdmin) {
            return req.params.uid;
        } else {
            return profile._id;
        }
    }

    public static isAdmin = async (uname: string): Promise<boolean> => {
        const isAdmin = await AuthenticationController.adminDao.findAdmin(uname);
        return !!isAdmin;
    }

};