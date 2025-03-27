import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fullName: { type: String },
  image: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "User"], default: "User" },
  accountNumber: { type: String },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["Pending", "Active"], default: "Pending" },
  transactionCode: { code: { type: String }, expire: { type: Date } },
  codeDescription: { type: String },
  hasTransactionCode: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
