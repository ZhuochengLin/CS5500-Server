import LikeModel from "../mongoose/likes/LikeModel";
import Like from "../models/likes/Like";

export default class LikeDao {

    private static likeDao: LikeDao | null = null;

    public static getInstance = () => {
        if (LikeDao.likeDao === null) {
            LikeDao.likeDao = new LikeDao();
        }
        return LikeDao.likeDao;
    }

    private constructor() {
    }

    userLikesTuit = async (uid: string, tid: string): Promise<Like> => {
        return LikeModel.create({tuit: tid, likedBy: uid});
    }

    userUnlikesTuit = async (uid: string, tid: string): Promise<any> => {
        return LikeModel.deleteOne({tuit: tid, likedBy: uid});
    }

    findAllTuitsLikedByUser = async (uid: string): Promise<Like[]> => {
        return LikeModel.find({likedBy: uid}).populate(
            {path: "tuit", populate: {path: "postedBy"}}).exec();
    }

    findAllLikes = async (): Promise<Like[]> => {
        return LikeModel.find({});
    }

    findUserAlreadyLikedTuit = async (uid: string, tid: string): Promise<Like | null> => {
        return LikeModel.findOne({tuit: tid, likedBy: uid});
    }

    findHowManyLikedTuit = async (tid: string): Promise<number> => {
        return LikeModel.countDocuments({tuit: tid});
    }

}

