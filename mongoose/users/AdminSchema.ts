import mongoose from "mongoose";
import Admin from "../../models/users/Admin";

const AdminSchema = new mongoose.Schema<Admin>({
    username: {type: String, required: true}
}, {collection: "admins"});
export default AdminSchema;