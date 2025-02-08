import { model, models, Schema, Types } from "mongoose";

// schemas
import reactionsSchema from "../_schemas/reactions.schema";

const commentSchema = new Schema(
  {
    post: { type: Types.ObjectId, ref: "Post" },
    owner: { type: Types.ObjectId, ref: "User" },
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
        switch ((this as { community: string }).community) {
          case "page": {
            return "Page";
          }
          case "group": {
            return "Group";
          }
        }
      },
    },
  },
  { timestamps: true }
);

export default models["Comment"] ?? model("Comment", commentSchema);
