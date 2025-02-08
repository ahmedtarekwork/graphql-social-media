import { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    icon: {
      type: String,
      enum: [
        "friend",
        "page",
        "group",
        "post",
        "comment",
        "sad",
        "angry",
        "love",
        "like",
        "not_specified",
      ],
      default: "not_specified",
    },
    content: {
      type: String,
      required: [true, "notification content is required"],
    },
    url: {
      type: String,
      required: [true, "notification url is required"],
    },
    hasRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default notificationSchema;
