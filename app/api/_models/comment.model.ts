import { model, models, Schema, Types } from "mongoose";

// schemas
import reactionsSchema from "../_schemas/reactions.schema";

const commentSchema = new Schema(
  {
    post: { type: Types.ObjectId, ref: "Post", index: true },
    owner: { type: Types.ObjectId, ref: "User", index: true },
    comment: String,
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
    media: {
      type: [{ public_id: String, secure_url: String }],
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

export default models["Comment"] ?? model("Comment", commentSchema);
