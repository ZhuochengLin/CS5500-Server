import User from "../users/User";
import Stats from "./Stats";

export default interface Tuit {
    tuit: string,
    postedBy: User,
    postedOn?: Date,
    image: Array<String>,
    video?: String,
    avatarLogo?: String,
    imageOverlay?: String,
    stats: Stats
};