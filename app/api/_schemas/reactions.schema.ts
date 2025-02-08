import { Schema, Types } from "mongoose";

const reactionsSchema = new Schema(
  {
    like: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User" }],
    },
    love: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User" }],
    },
    sad: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User" }],
    },
    angry: {
      count: { type: Number },
      users: [{ type: Types.ObjectId, ref: "User" }],
    },
  },
  { _id: false, timestamps: false }
);

export default reactionsSchema;
