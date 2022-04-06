import mongoose from "mongoose";
import AdminSchema from "./AdminSchema";

const AdminModel = mongoose.model("AdminModel", AdminSchema);
export default AdminModel;