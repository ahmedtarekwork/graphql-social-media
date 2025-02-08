import { model, models, Schema, Types } from "mongoose";

// schemas
import reactionsSchema from "../_schemas/reactions.schema";

const storySchema = new Schema(
  {
    caption: { type: String },
    owner: { type: Types.ObjectId, ref: "User" },
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
      type: { public_id: String, secure_url: String },
    },
    expiredData: {
      type: Number,
      default: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).getTime(),
    },
  },
  { timestamps: true }
);

export default models["Story"] ?? model("Story", storySchema);
