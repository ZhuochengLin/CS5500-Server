import {MediaContentExceedsLimitError} from "../errors/CustomErrors";
import {IMAGE_FIELD, VIDEO_FIELD} from "../utils/constants";

const cloudinary = require('cloudinary').v2;

export default class CloudinaryDao {

    private static cloudinaryDao: CloudinaryDao | null = null;
    private static cloudinaryUploader = cloudinary.uploader;
    private static cloudinaryAPI = cloudinary.api;

    public static getInstance = () => {
        if (CloudinaryDao.cloudinaryDao === null) {
            CloudinaryDao.cloudinaryDao = new CloudinaryDao();
        }
        return CloudinaryDao.cloudinaryDao;
    }

    uploadMedia = async (assets: Express.Multer.File[], limit: number): Promise<string[]> => {
        if (!assets) {
            return [];
        }
        if (assets.length > limit) {
            throw new MediaContentExceedsLimitError();
        }
        const mediaBuffers = assets.map((f) => {
            return `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
        });
        const mediaUrls = []
        for (let buffer of mediaBuffers) {
            const response = await CloudinaryDao.cloudinaryUploader.upload(buffer, {resource_type: "auto"});
            mediaUrls.push(response.secure_url);
        }
        return mediaUrls;
    }

    findCloudMedia = async (): Promise<{}> => {
        const media = {};
        // @ts-ignore
        media[IMAGE_FIELD] = await this.findCloudImages();
        // @ts-ignore
        media[VIDEO_FIELD] = await this.findCloudVideos();
        return  media;
    }

    findCloudImages = async (): Promise<[]> => {
        return CloudinaryDao.cloudinaryAPI.resources().then((res: { resources: any; }) => res.resources);
    }

    findCloudVideos = async (): Promise<[]> => {
        return CloudinaryDao.cloudinaryAPI.resources({resource_type: "video"}).then((res: { resources: any; }) => res.resources);
    }

    deleteImages = async (publicIds: string[]): Promise<any> => {
        return CloudinaryDao.cloudinaryAPI.delete_resources(publicIds);
    }

    deleteVideos = async (publicIds: string[]): Promise<any> => {
        return CloudinaryDao.cloudinaryAPI.delete_resources(publicIds, {resource_type: "video"});
    }

}