import { model, models, Schema, Types } from "mongoose";

const pageSchema = new Schema(
  {
    name: { type: String, required: [true, "page must have a name"] },
    owner: { type: Types.ObjectId, ref: "User", index: true },
    admins: {
      type: [{ type: Types.ObjectId, ref: "User", index: true }],
      default: [],
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    profilePicture: {
      type: {
        public_id: String,
        secure_url: String,
      },
      default: null,
    },
    coverPicture: {
      type: {
        public_id: String,
        secure_url: String,
      },
      default: null,
    },
  },
  { timestamps: true }
);

export default models["Page"] ?? model("Page", pageSchema);
