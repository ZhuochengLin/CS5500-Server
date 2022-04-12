import mongoose from "mongoose";
import User from "../../models/users/User";

const UserSchema = new mongoose.Schema<User>({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    firstName: String,
    lastName: String,
    email: String,
    profilePhoto: {type: String, default: "https://res.cloudinary.com/cs5500project/image/upload/v1649800906/masood-aslami-AEy620IRo6s-unsplash_bm62mt.jpg"},
    headerImage: {type: String, default: "https://res.cloudinary.com/cs5500project/image/upload/v1649800810/barbare-kacharava-YTF0b5ERUVE-unsplash_ouccid.jpg"},
    bio: String,
    dateOfBirth: Date,
    joined: {type: Date, default: new Date()},
    accountType: {type: String, enum: ["PERSONAL", "ACADEMIC", "PROFESSIONAL"], default: "PERSONAL"},
    maritalStatus: {type: String, enum: ["MARRIED", "SINGLE", "WIDOWED"], default: "SINGLE"},
    location: {
        latitude: Number,
        longitude: Number
    }
}, {collection: "users"});

export default UserSchema;