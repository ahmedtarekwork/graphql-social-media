import { model, models, Schema, Types } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "group name is required"],
    },
    owner: { type: Types.ObjectId, ref: "User", index: true },
    admins: [{ type: Types.ObjectId, ref: "User", index: true }],
    membersCount: {
      type: Number,
      default: 0,
    },
    privacy: {
      type: String,
      enum: ["public", "members_only"],
      default: "public",
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

    joinRequests: {
      type: [
        {
          user: { type: Types.ObjectId, ref: "User", index: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default models["Group"] ?? model("Group", groupSchema);
