import { Schema, Types } from "mongoose";

const reactionsSchema = new Schema(
  {
    like: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User", index: true }],
    },
    love: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User", index: true }],
    },
    sad: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User", index: true }],
    },
    angry: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User", index: true }],
    },
  },
  { _id: false, timestamps: false }
);

export default reactionsSchema;
