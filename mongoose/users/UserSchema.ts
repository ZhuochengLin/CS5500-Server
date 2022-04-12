import mongoose from "mongoose";
import User from "../../models/users/User";

const UserSchema = new mongoose.Schema<User>({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    firstName: String,
    lastName: String,
    email: String,
    profilePhoto: String,
    headerImage: String,
    bio: String,
    dateOfBirth: Date,
    accountType: {type: String, enum: ["PERSONAL", "ACADEMIC", "PROFESSIONAL"], default: "PERSONAL"},
    maritalStatus: {type: String, enum: ["MARRIED", "SINGLE", "WIDOWED"], default: "SINGLE"},
    location: {
        latitude: Number,
        longitude: Number
    }
}, {collection: "users"});

export default UserSchema;