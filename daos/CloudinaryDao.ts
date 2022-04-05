import path from "path";

const cloudinary = require('cloudinary').v2;
const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();

export default class CloudinaryDao {

    private static cloudinaryDao: CloudinaryDao | null = null;
    private static cloudinaryUploader = cloudinary.uploader;

    public static getInstance = () => {
        if (CloudinaryDao.cloudinaryDao === null) {
            CloudinaryDao.cloudinaryDao = new CloudinaryDao();
        }
        return CloudinaryDao.cloudinaryDao;
    }

    uploadImages = async (images: Express.Multer.File[]): Promise<any[]> => {
        const imageBuffers = images.map((i) =>
            parser.format(path.extname(i.originalname), i.buffer).content);
        const mediaUrls = []
        for (let buffer of imageBuffers) {
            const response = await CloudinaryDao.cloudinaryUploader.upload(buffer);
            mediaUrls.push(response.url);
        }
        return mediaUrls;
    }

    uploadVideo = async (file: Express.Multer.File[]): Promise<any[]> => {
        return [];
    }
}