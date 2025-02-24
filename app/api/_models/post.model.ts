import { model, models, Schema, Types } from "mongoose";

// schemas
import reactionsSchema from "../_schemas/reactions.schema";

const postSchema = new Schema(
  {
    caption: { type: String },
    owner: { type: Types.ObjectId, ref: "User", index: true },
    commentsCount: {
      type: Number,
      default: 0,
    },
    blockComments: { type: Boolean, default: false },
    reactions: {
      type: reactionsSchema,
      default: {
        like: {
          count: 0,
          users: [],
        },
        love: {
          count: 0,
          users: [],
        },
        sad: {
          count: 0,
          users: [],
        },
        angry: {
          count: 0,
          users: [],
        },
      },
    },
    shareData: {
      count: {
        type: Number,
        default: 0,
      },
      users: [{ type: Types.ObjectId, ref: "User", index: true }],
    },
    media: {
      type: [{ public_id: String, secure_url: String }],
    },
    privacy: {
      type: String,
      enum: ["only_me", "friends_only", "public"],
      default: "public",
    },
    community: {
      type: String,
      enum: ["personal", "page", "group"],
      default: "personal",
    },
    communityId: {
      type: Types.ObjectId,
      ref: function () {
        const community = (this as { community: string }).community;
        if (community !== "personal")
          return `${community[0].toUpperCase()}${community.slice(1)}`;
      },
    },
  },
  { timestamps: true }
);

export default models["Post"] ?? model("Post", postSchema);
