import { model, models, Schema, Types } from "mongoose";
import { isEmail } from "validator";

// models

import notificationSchema from "../_schemas/notification.schema";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "this username is already taken"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
      min: [6, "password must be 6 characters or more"],
    },
    email: {
      type: String,
      unique: [true, "this email is already taken"],
      required: [true, "email is required"],
      validate: [
        (value: string) => isEmail(value),
        "please enter a valid email",
      ],
    },
    address: { type: String, required: [true, "address is required"] },
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

    notifications: { type: [notificationSchema], default: [] },

    friendsRequests: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
      default: [],
    },

    friendsList: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
      default: [],
    },

    savedPosts: {
      type: [{ type: Types.ObjectId, ref: "Post", index: true }],
      default: [],
    },

    allPosts: {
      type: [
        {
          post: { type: Types.ObjectId, ref: "Post", index: true },
          shareDate: {
            type: Date,
            default: Date.now(),
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
        },
      ],
      default: [],
    },

    sharedPosts: {
      type: [{ type: Types.ObjectId, ref: "Post", index: true }],
      default: [],
    },

    ownedPages: [{ type: Types.ObjectId, ref: "Page", index: true }],
    adminPages: [{ type: Types.ObjectId, ref: "Page", index: true }],

    followedPages: {
      type: [{ type: Types.ObjectId, ref: "Page", index: true }],
      default: [],
    },

    joinedGroups: {
      type: [{ type: Types.ObjectId, ref: "Group", index: true }],
      default: [],
    },
    adminGroups: {
      type: [{ type: Types.ObjectId, ref: "Group", index: true }],
      default: [],
    },
    ownedGroups: {
      type: [{ type: Types.ObjectId, ref: "Group", index: true }],
      default: [],
    },
  },
  { timestamps: true }
);

export default models["User"] ?? model("User", userSchema);
