import {Request} from "express";
import {MultiTypeMediaError} from "../errors/CustomErrors";
import CloudinaryDao from "../daos/CloudinaryDao";
import Media from "../models/tuits/Media";

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

    uploadMedia = async (files: any, field: string, limit: number): Promise<string[]> => {
        if (!files) {
            return Promise.resolve([]);
        }
        // @ts-ignore
        const media_urls = field in files ? await CloudinaryController.cloudinaryDao.uploadMedia(files[field], limit) : [];
        return Promise.resolve(media_urls);
    }

}