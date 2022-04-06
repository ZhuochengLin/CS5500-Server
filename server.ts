/**
 * @file Implements an Express Node HTTP server. Declares RESTful Web services
 * enabling CRUD operations on the following resources:
 * <ul>
 *     <li>users</li>
 *     <li>tuits</li>
 *     <li>likes</li>
 * </ul>
 * 
 * Connects to a remote MongoDB instance hosted on the Atlas cloud database
 * service
 */
import express, {Request, Response} from 'express';
import UserController from "./controllers/UserController";
import TuitController from "./controllers/TuitController";
import AuthenticationController from "./controllers/AuthenticationController";
import mongoose from "mongoose";
import {config} from "dotenv";
import {LogErrors} from "./errors/LogErrors";
import {ErrorHandler} from "./errors/ErrorHandler";
import LikeController from "./controllers/LikeController";
const cors = require("cors");
const session = require("express-session");

config();
mongoose.connect(`${process.env.DB_URI}`, (err) => {
    if (err) throw err;
    console.log("MongoDB connected!")
});
const cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
console.log("Cloudinary configured!");

const app = express();
app.use(
    cors({credentials: true, origin: true})
);

let sess = {
    secret: process.env.EXPRESS_SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: {
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        secure: process.env.NODE_ENV === "production",
    }
}

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1) // trust first proxy
}

app.use(session(sess))
app.use(express.json());

app.get('/', (req: Request, res: Response) =>
    res.send('Welcome!'));

// create RESTful Web service API
const userController = UserController.getInstance(app);
const tuitController = TuitController.getInstance(app);
const authenticationController = AuthenticationController.getInstance(app);
const likeController = LikeController.getInstance(app);

/**
 * Start a server listening at port 4000 locally
 * but use environment variable PORT on Heroku if available.
 */
const PORT = 4000;
app.use(LogErrors);
app.use(ErrorHandler);
app.listen(process.env.PORT || PORT);
