import {Express, NextFunction, Request, Response} from "express";
import {MultiTypeMediaError, NoPermissionError} from "../errors/CustomErrors";
import CloudinaryDao from "../daos/CloudinaryDao";
import Media from "../models/tuits/Media";
import TuitDao from "../daos/TuitDao";
import {HEADER_IMAGE_FIELD, IMAGE_FIELD, PROFILE_PHOTO_FIELD, VIDEO_FIELD} from "../utils/constants";
import UserDao from "../daos/UserDao";
import AuthenticationController from "./AuthenticationController";

export default class CloudinaryController {

    private static cloudinaryController: CloudinaryController | null = null;
    private static cloudinaryDao: CloudinaryDao = CloudinaryDao.getInstance();
    private static tuitDao: TuitDao = TuitDao.getInstance();
    private static userDao: UserDao = UserDao.getInstance();

    public static getInstance = (app: Express) => {
        if (CloudinaryController.cloudinaryController === null) {
            CloudinaryController.cloudinaryController = new CloudinaryController();
            app.get("/api/cloudinary/media", CloudinaryController.cloudinaryController.findAllCloudMedia);
            app.delete("/api/cloudinary/media", CloudinaryController.cloudinaryController.deleteTrashMedia);
        }
        return CloudinaryController.cloudinaryController;
    }

    private constructor() {
    }

    findAllCloudMedia = (req: Request, res: Response, next: NextFunction) => {
        CloudinaryController.cloudinaryDao.findAllCloudMedia()
            // @ts-ignore
            .then(media => res.json(media))
            .catch(next);
    }

    deleteTrashMedia = async (req: Request, res: Response, next: NextFunction) => {
        let profile;
        try {
            profile = AuthenticationController.checkLogin(req);
        } catch (e) {
            next(e);
            return
        }
        const isAdmin = await AuthenticationController.isAdmin(profile.username);
        if (isAdmin) {
            const localMedia = this.findAllLocalMedia();
            const cloudMedia = await CloudinaryController.cloudinaryDao.findAllCloudMedia();
            const trashMediaIds = [];
            for (const m of cloudMedia) {
                // @ts-ignore
                if (m.secure_url in localMedia) {
                    continue;
                }
                // @ts-ignore
                trashMediaIds.push(m.public_id);
            }
            CloudinaryController.cloudinaryDao.deleteMedia(trashMediaIds)
                .then(status => res.json(status))
                .catch(next);
        } else {
            next(new NoPermissionError());
        }
    }

    private findAllLocalMedia = async (): Promise<Set<any>> => {
        const localMedia = new Set();
        // tuit
        const tuits = await CloudinaryController.tuitDao.findAllTuits();
        for (const t of tuits) {
            t[IMAGE_FIELD].forEach(url => localMedia.add(url));
            t[VIDEO_FIELD].forEach(url => localMedia.add(url));
        }
        // user
        const users = await CloudinaryController.userDao.findAllUsers();
        for (const u of users) {
            localMedia.add(u[HEADER_IMAGE_FIELD]);
            localMedia.add(u[PROFILE_PHOTO_FIELD]);
        }
        return localMedia;
    }


}