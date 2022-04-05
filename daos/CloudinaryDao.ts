import {MediaContentExceedsLimitError} from "../errors/CustomErrors";

const cloudinary = require('cloudinary').v2;
const DatauriParser = require('datauri/parser');

export default class CloudinaryDao {

    private static cloudinaryDao: CloudinaryDao | null = null;
    private static cloudinaryUploader = cloudinary.uploader;

    public static getInstance = () => {
        if (CloudinaryDao.cloudinaryDao === null) {
            CloudinaryDao.cloudinaryDao = new CloudinaryDao();
        }
        return CloudinaryDao.cloudinaryDao;
    }

    uploadMedia = async (assets: Express.Multer.File[], limit: number): Promise<string[]> => {
        if (assets.length > limit) {
            throw new MediaContentExceedsLimitError();
        }
        const mediaBuffers = assets.map((f) => {
            return `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
        });
        const mediaUrls = []
        for (let buffer of mediaBuffers) {
            const response = await CloudinaryDao.cloudinaryUploader.upload(buffer, {resource_type: "auto"});
            mediaUrls.push(response.url);
        }
        return mediaUrls;
    }

}