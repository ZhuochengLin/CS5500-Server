import {Express, NextFunction, Request, Response} from "express";
import {EmptyMediaError, MultiTypeMediaError, UnsupportedMediaError} from "../errors/CustomErrors";
import * as path from "path";
import CloudinaryDao from "../daos/CloudinaryDao";

const multer = require("multer");
const memoStorage = multer.memoryStorage();
const upload = multer({storage: memoStorage});
const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();

export default class CloudinaryController {

    private static cloudinaryController: CloudinaryController | null = null;
    private static cloudinaryDao: CloudinaryDao = CloudinaryDao.getInstance();

    public static getInstance = () => {
        if (CloudinaryController.cloudinaryController === null) {
            CloudinaryController.cloudinaryController = new CloudinaryController();
        }
        return CloudinaryController.cloudinaryController;
    }

    uploadMedia = (req: Request): Promise<any[]> => {
        const files = req.files;
        if (!files) {
            return Promise.resolve([]);
        }
        if ("images" in files && "video" in files) {
            throw new MultiTypeMediaError()
        }
        if ("images" in files) {
            return CloudinaryController.cloudinaryDao.uploadImages(files["images"]);
        }
        if ("video" in files) {
            return CloudinaryController.cloudinaryDao.uploadVideo(files["video"]);
        }
        return Promise.resolve([]);
    }

}