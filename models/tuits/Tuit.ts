import User from "../users/User";
import Stats from "./Stats";

export default interface Tuit {
    tuit: string,
    postedBy: User,
    postedOn?: Date,
    image: Array<string>,
    video: Array<string>,
    avatarLogo?: string,
    imageOverlay?: string,
    stats: Stats
};