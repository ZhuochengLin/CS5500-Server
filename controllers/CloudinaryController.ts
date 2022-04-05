import {Request} from "express";
import {MultiTypeMediaError} from "../errors/CustomErrors";
import CloudinaryDao from "../daos/CloudinaryDao";

export default class CloudinaryController {

    private static cloudinaryController: CloudinaryController | null = null;
    private static cloudinaryDao: CloudinaryDao = CloudinaryDao.getInstance();

    public static getInstance = () => {
        if (CloudinaryController.cloudinaryController === null) {
            CloudinaryController.cloudinaryController = new CloudinaryController();
        }
        return CloudinaryController.cloudinaryController;
    }

    private constructor() {
    }

    uploadMedia = async (req: Request): Promise<any> => {
        const media = {"image": null, "video": null};
        const files = req.files;
        if (!files) {
            return Promise.resolve(media);
        }
        if ("image" in files && "video" in files) {
            throw new MultiTypeMediaError()
        }
        // @ts-ignore
        media.image = "image" in files ?
            await CloudinaryController.cloudinaryDao.uploadMedia(files["image"], 6) : [];
        // @ts-ignore
        media.video = "video" in files ?
            (await CloudinaryController.cloudinaryDao.uploadMedia(files["video"], 1))[0] : "";
        return Promise.resolve(media);
    }

}