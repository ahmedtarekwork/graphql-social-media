// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import { isEmail } from "validator";
import { SignJWT } from "jose";
import { compare, genSalt, hash } from "bcrypt";
import handleConnectDB from "@/lib/handleConnectDB";
import validateToken from "@/lib/validateToken";
import connectDB from "@/lib/connectDB";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import User from "../_models/user.model";
import Page from "../_models/page.model";
import Group from "../_models/group.model";
import Post from "../_models/post.model";
import Comment from "../_models/comment.model";
import Story from "../_models/story.model";

// types
import type { NextRequest } from "next/server";
import type {
  APIContextFnType,
  NotFullUserType,
  GroupType,
  ImageType,
  PageType,
  Pagination,
  ReqUserType,
  UserType,
} from "@/lib/types";

const userResolvers = {
  Query: {
    getSingleUser: async (_: unknown, { userId }: { userId: string }) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting user info",
        async resolveCallback() {
          const user = await User.findById(userId).select(
            "_id username profilePicture coverPicture email address"
          );

          if (!user) {
            throw new GraphQLError("user with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return user;
        },
      }),

    getAllUsers: async (
      _: unknown,
      { wantedUsers: { limit = 0, page = 1 } }: { wantedUsers: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while getting the users",
        async resolveCallback(user) {
          const [users, usersCount] = await Promise.allSettled([
            User.find({ _id: { $nin: [user._id] } })
              .skip(page - 1)
              .limit(limit)
              .select("username profilePicture"),

            User.countDocuments(),
          ]);

          if ([users, usersCount].some((res) => res.status === "rejected")) {
            throw new GraphQLError(
              "something went wrong while getting the users",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          return {
            users:
              (users as unknown as { value: NotFullUserType[] }).value || [],
            isFinalPage:
              page * limit >=
                (usersCount as unknown as { value: number })?.value || 0,
          };
        },
      }),

    checkUser: async (
      _: unknown,
      __: unknown,
      { req }: { req: NextRequest }
    ) => {
      await connectDB();
      const user = await validateToken(req, (userId) =>
        User.findById(userId)
          .select("_id username profilePicture coverPicture email address")
          .populate([
            {
              path: "followedPages joinedGroups ownedPages adminPages ownedGroups adminGroups",
              options: { limit: 10 },
            },
          ])
      );

      if (user) {
        return {
          ...user,
          password: undefined,
        };
      } else return;
    },

    // notifications
    getUserNotificationsCount: async (
      _: unknown,
      __: unknown,
      { req }: { req: NextRequest }
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while getting the notifications count",
        async resolveCallback(authUser) {
          const count = await User.aggregate([
            { $match: { _id: new Types.ObjectId(authUser._id) } },
            {
              $project: {
                notifications: {
                  $size: {
                    $filter: {
                      input: "$notifications",
                      as: "item",
                      cond: { $eq: ["$$item.hasRead", false] },
                    },
                  },
                },
              },
            },
          ]);

          return { count: count[0].notifications };
        },
      }),
    getUserNotifications: async (
      _: unknown,
      {
        notificationsPagination: { page, limit },
      }: { notificationsPagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "somehting went wrong while getting your notifications",

        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                notificationsCount: [
                  {
                    $project: {
                      notificationsCount: {
                        $size: "$notifications",
                      },
                    },
                  },
                ],

                notificaitons: [
                  { $unwind: "$notifications" },
                  { $sort: { "notifications.createdAt": -1 } },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },
                  {
                    $group: {
                      _id: "$_id",
                      notifications: { $push: "$notifications" },
                    },
                  },
                ],
              },
            },
          ]);

          const notifications =
            result?.[0]?.notificaitons?.[0]?.notifications || [];
          const notificationsCount =
            result?.[0]?.notificationsCount?.[0]?.notificationsCount || 0;

          return {
            notifications,
            isFinalPage: page * limit >= notificationsCount,
          };
        },
      }),

    // posts
    getUserSavedPosts: async (
      _: unknown,
      {
        postsPaginations: { page = 1, limit = 0 },
      }: { postsPaginations: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while getting your saved posts",
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                savedPostsCount: [
                  {
                    $project: {
                      savedPostsCount: {
                        $size: "$savedPosts",
                      },
                    },
                  },
                ],

                savedPosts: [
                  { $unwind: "$savedPosts" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "posts",
                      localField: "savedPosts",
                      foreignField: "_id",
                      as: "postInfo",
                    },
                  },
                  {
                    $unwind: "$postInfo",
                  },
                  {
                    $project: {
                      _id: 1,
                      postInfo: {
                        _id: 1,
                        caption: 1,
                        media: {
                          $cond: {
                            if: { $isArray: "$postInfo.media" },
                            then: { $arrayElemAt: ["$postInfo.media", 0] },
                            else: null,
                          },
                        },
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      savedPosts: { $push: "$postInfo" },
                    },
                  },
                ],
              },
            },
          ]);

          const savedPosts = result?.[0]?.savedPosts?.[0]?.savedPosts || [];
          const savedPostsCount =
            result?.[0]?.savedPostsCount?.[0]?.savedPostsCount || 0;

          return {
            savedPosts,
            isFinalPage: page * limit >= savedPostsCount,
          };
        },
      }),

    // friends
    getUserFriends: async (
      _: unknown,
      {
        friendsPagination: { page = 1, limit = 0, userId },
      }: { friendsPagination: Pagination & { userId: string } }
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting your friends",

        async resolveCallback() {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(userId) } },
            {
              $facet: {
                friendsCount: [
                  {
                    $project: {
                      friendsCount: {
                        $size: { $ifNull: ["$friendsList", []] },
                      },
                    },
                  },
                ],

                friendsList: [
                  { $unwind: "$friendsList" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "users",
                      localField: "friendsList",
                      foreignField: "_id",
                      as: "userInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      friendsList: 1,
                      userInfo: {
                        username: 1,
                        _id: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      friendsList: {
                        $push: "$userInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            friends: result?.[0]?.friendsList?.[0]?.friendsList?.[0] || [],
            isFinalPage: result?.[0]?.friendsCount?.[0]?.friendsCount || true,
          };
        },
      }),

    getUserFriendsCount: async (_: unknown, { userId }: { userId: string }) =>
      await handleConnectDB({
        publicErrorMsg: "can't get friends count at the momment",
        async resolveCallback() {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(userId) } },
            {
              $project: {
                friendsCount: {
                  $size: "$friendsList",
                },
              },
            },
          ]);

          return { count: result?.[0]?.friendsCount || 0 };
        },
      }),

    // friendship requests
    getUserFriendshipRequestsCount: async (
      _: unknown,
      __: unknown,
      { req }: { req: NextRequest }
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while getting the friendship requests count",

        async resolveCallback(authUser) {
          const count = await User.aggregate([
            { $match: { _id: new Types.ObjectId(authUser._id) } },
            {
              $project: {
                friendsRequests: {
                  $size: "$friendsRequests",
                },
              },
            },
          ]);

          return { count: count[0].friendsRequests };
        },
      }),

    doesCurrentUserSentFriendshipRequest: async (
      _: unknown,
      { receverId }: { receverId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong",
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(receverId) } },
            {
              $project: {
                friendshipRequestExists: {
                  $in: [new Types.ObjectId(user._id), "$friendsRequests"],
                },
              },
            },
            { $match: { friendshipRequestExists: true } },
          ]);

          return { status: !!result?.[0]?.friendshipRequestExists };
        },
      }),
    doesCurrentUserRecevedFriendshipRequest: async (
      _: unknown,
      { senderId }: { senderId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong",
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $project: {
                friendshipRequestExists: {
                  $in: [new Types.ObjectId(senderId), "$friendsRequests"],
                },
              },
            },
            { $match: { friendshipRequestExists: true } },
          ]);

          return { status: !!result?.[0]?.friendshipRequestExists };
        },
      }),
    isUserMyFriend: async (
      _: unknown,
      { userId }: { userId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong",
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $project: {
                friendExists: {
                  $in: [new Types.ObjectId(userId), "$friendsList"],
                },
              },
            },
            { $match: { friendExists: true } },
          ]);

          return { status: !!result?.[0]?.friendExists };
        },
      }),

    getUserFriendsRequests: async (
      _: unknown,
      {
        requestsPagination: { page = 1, limit = 0 },
      }: { requestsPagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while getting your friendship requests",

        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                friendsRequestsCount: [
                  {
                    $project: {
                      friendsRequestsCount: {
                        $size: { $ifNull: ["$friendsRequests", []] },
                      },
                    },
                  },
                ],

                friendsRequests: [
                  { $unwind: "$friendsRequests" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "users",
                      localField: "friendsRequests",
                      foreignField: "_id",
                      as: "userInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      friendsRequests: 1,
                      userInfo: {
                        username: 1,
                        _id: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      friendsRequests: {
                        $push: "$userInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          const friendsRequestsCount =
            result[0]?.friendsRequestsCount?.[0]?.friendsRequestsCount;
          const friendsRequests =
            result?.[0]?.friendsRequests?.[0]?.friendsRequests?.[0];

          return {
            friendsRequests: friendsRequests || [],
            isFinalPage: page * limit >= friendsRequestsCount || true,
          };
        },
      }),
  },

  Mutation: {
    registerUser: async (
      _: unknown,
      {
        userData,
      }: {
        userData: Pick<
          ReqUserType,
          | "username"
          | "email"
          | "password"
          | "address"
          | "profilePicture"
          | "coverPicture"
        >;
      },
      context: { req: NextRequest }
    ) => {
      const email = userData.email;
      const username = userData.username;
      const password = userData.password;
      const address = userData.address;

      const requiredValues = [
        { key: "email", value: email },
        { key: "username", value: username },
        { key: "password", value: password },
        { key: "address", value: address },
      ];

      for (let i = 0; i < requiredValues.length; i++) {
        if (!requiredValues[i].value) {
          throw new GraphQLError(`${requiredValues[i].key} is required`, {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          });
        }
      }

      if (!isEmail(email)) {
        throw new GraphQLError("please insert a valid email", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
          },
        });
      }

      if (password.length < 6) {
        throw new GraphQLError("password must be 6 or more characters", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
          },
        });
      }

      return await handleConnectDB({
        async resolveCallback() {
          const existUser = await User.findOne({
            $or: [{ username }, { email }],
          }).select("username email");

          if (existUser) {
            const sameEmail = existUser.email === email;
            const sameUsername = existUser.username === username;

            const duplicatedValues = `${sameEmail ? "email" : ""}${
              sameEmail && sameUsername ? " and " : ""
            }${sameUsername ? `username` : ""}`;

            const errorMsg = `${duplicatedValues} is already taken`;

            throw new GraphQLError(errorMsg, {
              extensions: {
                code: ApolloServerErrorCode.BAD_REQUEST,
              },
            });
          }

          const hashedPassword = await hash(password, await genSalt());

          const newUser = await User.create({
            ...userData,
            password: hashedPassword,
          });

          const token = await new SignJWT({
            id: newUser._doc._id,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("30d")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

          context.req.cookies.set("token", token);

          return { ...newUser._doc, password: undefined };
        },
        publicErrorMsg: "something went wrong while register a new user",
        showDatabaseErr: true,
      });
    },

    loginUser: async (
      _: unknown,
      {
        loginCredintials: { username, password },
      }: { loginCredintials: Pick<ReqUserType, "username" | "password"> },
      context: { req: NextRequest }
    ) => {
      const requiredValues = [
        { key: "username", value: username },
        { key: "password", value: password },
      ];

      for (let i = 0; i < requiredValues.length; i++) {
        if (!requiredValues[0].value)
          throw new GraphQLError(`${requiredValues[0].key} is required`, {
            extensions: {
              code: ApolloServerErrorCode.BAD_USER_INPUT,
            },
          });
      }

      return await handleConnectDB({
        async resolveCallback() {
          const userDoc = (
            await User.findOne({ username }).select(
              "_id username email address profilePicture coverPicture password"
            )
          )?._doc;

          if (!userDoc) {
            throw new GraphQLError("no user with this username not found", {
              extensions: {
                code: "NOT_FOUND",
              },
            });
          }

          const comparePassword = await compare(password, userDoc.password);

          if (!comparePassword) {
            throw new GraphQLError("password incorrect", {
              extensions: { coded: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const token = await new SignJWT({
            id: userDoc._id,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("30d")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

          context.req.cookies.set("token", token);

          return { ...userDoc, password: undefined };
        },
        publicErrorMsg: "something went wrong while do this operation",
        showDatabaseErr: true,
      });
    },

    changeUserData: async (
      _: unknown,
      { newUserData }: { newUserData: Partial<ReqUserType> },
      { req }: { req: NextRequest }
    ) => {
      if ("password" in newUserData) {
        if (newUserData.password!.length < 6) {
          throw new GraphQLError("new password must be 6 characters or more", {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          });
        }
      }

      const picutresProps = Object.entries(newUserData).filter(([key]) =>
        ["profilePicture", "coverPicture"].includes(key)
      );

      if (picutresProps.length) {
        for (let i = 0; i < picutresProps.length; i++) {
          const [key, value] = picutresProps[i];

          const imageError = ["public_id", "secure_url"].some(
            (key) =>
              !(key in (value as ImageType)) ||
              !value?.[key as keyof typeof value] ||
              typeof value[key as keyof typeof value] !== "string"
          );

          if (imageError) {
            throw new GraphQLError(`please insert a valid ${key} properties`, {
              extensions: {
                code: ApolloServerErrorCode.BAD_USER_INPUT,
              },
            });
          }
        }
      }

      return await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg: "something went wrong while changing your info",
        async resolveCallback(AuthUser) {
          const checkForSameUsernameOrEmail = async (
            key: "username" | "email"
          ) => {
            if (key in newUserData) {
              if (AuthUser[key] === newUserData[key]) {
                throw new GraphQLError(
                  `you can't update your ${key} with same value`,
                  {
                    extensions: {
                      code: ApolloServerErrorCode.BAD_USER_INPUT,
                    },
                  }
                );
              }

              if (await User.exists({ key: newUserData[key] })) {
                throw new GraphQLError(`this ${key} is already taken`, {
                  extensions: { code: "CONFLICT" },
                });
              }
            }
          };

          const duplicatedValues = await Promise.allSettled([
            checkForSameUsernameOrEmail("email"),
            checkForSameUsernameOrEmail("username"),
          ]);

          for (let i = 0; i < duplicatedValues.length; i++) {
            if (
              duplicatedValues[i].status === "rejected" &&
              (duplicatedValues[i] as { reason: unknown }).reason instanceof
                GraphQLError
            ) {
              throw (duplicatedValues[i] as { reason: unknown }).reason;
            }
          }

          if ("password" in newUserData) {
            const samePassword = await compare(
              newUserData.password!,
              AuthUser.password
            );

            if (samePassword)
              throw new GraphQLError(
                "you can't use current password as new password",
                {
                  extensions: {
                    code: ApolloServerErrorCode.BAD_USER_INPUT,
                  },
                }
              );
          }

          if (picutresProps.length) {
            const oldProfilePicture = AuthUser.profilePicture;
            const newProfilePicture = newUserData.profilePicture;

            const oldCoverPicture = AuthUser.coverPicture;
            const newCoverPicture = newUserData.coverPicture;

            const isSameImgs = (
              type: Extract<keyof UserType, "profilePicture" | "coverPicture">,
              oldData: ImageType | null | undefined,
              newData: ImageType | null | undefined
            ) => {
              if (oldData && newData) {
                const keys = Object.keys(oldData);

                const isSameImg = keys.every((key) => {
                  return (
                    oldData[key as keyof typeof oldData] ===
                    newData![key as keyof typeof newData]
                  );
                });

                if (isSameImg) {
                  return new GraphQLError(
                    `you can't replace with ${type} same picture`
                  );
                }
              }
            };

            const profilePictureErr = isSameImgs(
              "profilePicture",
              oldProfilePicture,
              newProfilePicture
            );
            const coverPictureErr = isSameImgs(
              "coverPicture",
              oldCoverPicture,
              newCoverPicture
            );

            if (
              [profilePictureErr, coverPictureErr].some(
                (err) => err instanceof GraphQLError
              )
            ) {
              throw profilePictureErr || coverPictureErr;
            }
          }

          const newUser = await User.findByIdAndUpdate(
            AuthUser._id,
            { $set: newUserData },
            { new: true }
          ).select("-password");

          if (!newUser) {
            throw new GraphQLError(
              "something went wrong while update your information",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          return newUser;
        },
      });
    },

    removeUserFromFriendsList: async (
      _: unknown,
      { userId }: { userId: string },
      { req }: APIContextFnType
    ) => {
      if (!userId) {
        throw new GraphQLError(
          "user id is required to remove him from your friends list",
          {
            extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
          }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while remove the user from your friends list",
        async resolveCallback(authUser) {
          if (authUser._id === userId) {
            throw new GraphQLError(
              "you can't add or remove your self from your friends list",
              {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              }
            );
          }

          if (!(await User.exists({ _id: userId }))) {
            throw new GraphQLError("user with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserFriend = await User.aggregate([
            { $match: { _id: new Types.ObjectId(authUser._id) } },
            {
              $project: {
                isUserFriend: {
                  $in: [new Types.ObjectId(userId), "$friendsList"],
                },
              },
            },
            { $match: { isUserFriend: true } },
          ]);

          if (!isUserFriend?.[0]?.isUserFriend) {
            throw new GraphQLError("user is already not a friend", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          await Promise.allSettled([
            User.updateOne(
              { _id: authUser._id },
              {
                $pull: {
                  friendsList: userId,
                },
              }
            ),

            User.updateOne(
              { _id: userId },
              {
                $pull: {
                  friendsList: authUser._id,
                },
              }
            ),
          ]);

          return {
            message: "user removed from your friends successfully",
            userId,
          };
        },
      });
    },

    sendFriendshipRequest: async (
      _: unknown,
      { userId }: { userId: string },
      { req }: APIContextFnType
    ) => {
      if (!userId) {
        throw new GraphQLError("user id is required to send request to him", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while send a friendship request to the user",
        async resolveCallback(authUser) {
          if (authUser._id === userId) {
            throw new GraphQLError(
              "you can't send friendship request to your self",
              {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              }
            );
          }

          const sendingTo = (await User.findById(userId))?._doc;

          if (!sendingTo) {
            throw new GraphQLError("user with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserFriend = await User.aggregate([
            { $match: { _id: new Types.ObjectId(authUser._id) } },
            {
              $project: {
                isUserFriend: {
                  $in: [new Types.ObjectId(userId), "$friendsList"],
                },
              },
            },
            { $match: { isUserFriend: true } },
          ]);

          if (isUserFriend?.[0]?.isUserFriend) {
            throw new GraphQLError("user is already in your friends list", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          await User.updateOne(
            { _id: userId },
            {
              $push: {
                friendsRequests: authUser._id,

                notifications: {
                  icon: "friend",
                  content: `${authUser.username} sent a friendship request to you.`,
                  url: "/friends/requests",
                },
              },
            }
          );

          return {
            message: "friendship request sent successfully",
          };
        },
      });
    },

    handleFriendShipRequest: async (
      _: unknown,
      {
        handleFriendshipRequestData: { userId, acception },
      }: {
        handleFriendshipRequestData: { userId: string; acception: boolean };
      },
      { req }: APIContextFnType
    ) => {
      if (!userId) {
        throw new GraphQLError("user id is required to send request to him", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (typeof acception !== "boolean") {
        throw new GraphQLError(
          "you must accept or denied the friendship request",
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while accept or denied the friendship request",
        async resolveCallback(authUser) {
          if (authUser._id === userId) {
            throw new GraphQLError(
              "you can't make friendship request to your self",
              {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              }
            );
          }

          if (!(await User.exists({ _id: userId }))) {
            throw new GraphQLError("user with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserFriend = await User.aggregate([
            { $match: { _id: new Types.ObjectId(authUser._id) } },
            {
              $project: {
                isUserFriend: {
                  $in: [new Types.ObjectId(userId), "$friendsList"],
                },
              },
            },
            { $match: { isUserFriend: true } },
          ]);

          if (isUserFriend?.[0]?.isUserFriend) {
            throw new GraphQLError("user is already in your friends list", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          if (acception) {
            const addAuthUserToFriendsListOfSender = User.updateOne(
              { _id: userId },
              {
                $push: {
                  friendsList: authUser._id,
                },
              }
            );

            const addSenderToFriendsListAndRemoveRequest = User.updateOne(
              {
                _id: authUser._id,
              },
              {
                $pull: { friendsRequests: userId },
                $push: {
                  friendsList: userId,
                },
              }
            );

            const response = await Promise.allSettled([
              addAuthUserToFriendsListOfSender,
              addSenderToFriendsListAndRemoveRequest,
            ]);

            if (response.every((res) => res.status === "fulfilled")) {
              const notification = {
                content: `${authUser.username} accepted your friendship request, you are now friends.`,
                icon: "friend",
                url: "/friends",
              };

              await User.updateOne(
                { _id: userId },
                {
                  $push: {
                    notifications: notification,
                  },
                }
              );

              return {
                message: "request accepted, you are now friends",
                id: userId,
              };
            }

            throw new GraphQLError(
              "something went wrong while accepting the friendship request",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          await User.updateOne(
            { _id: authUser._id },
            { $pull: { friendsRequests: userId } }
          );

          return {
            message: "you denied the friendship request",
            id: userId,
          };
        },
      });
    },

    markNotificationAsRead: async (
      _: unknown,
      { id }: { id: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while mark this notification as read",
        async resolveCallback(authUser) {
          await User.updateOne(
            { _id: authUser._id },
            { $set: { "notifications.$[item].hasRead": true } },
            { arrayFilters: [{ "item._id": id }] }
          );
          return { message: "notification marked as read", id };
        },
      }),

    markAllNotificationsAsRead: async (
      _: unknown,
      __: unknown,
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while mark all notifications as read",
        async resolveCallback(authUser) {
          await User.updateOne(
            { _id: authUser._id },
            { $set: { "notifications.$[].hasRead": true } }
          );
          return { message: "all notifications marked as read" };
        },
      }),

    deleteUser: async (_: unknown, __: unknown, { req }: APIContextFnType) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while deleting your account",

        userQuery: (userId: string) => {
          return User.findByIdAndDelete(userId)
            .select(
              "followedPages adminPages ownedPages joinedGroups adminGroups ownedGroups friendList allPosts profilePicture coverPicture"
            )
            .populate([
              {
                path: "ownedPages ownedGroups",
                select: "admins profilePicture coverPicture",
              },
              {
                path: "allPosts.post",
                select: "owner",
              },
            ]);
        },

        async resolveCallback(authUser: any) {
          // pages promises

          const removeUserFromFollowedPages = Page.updateMany(
            {
              _id: {
                $or: authUser.followedPages,
              },
            },
            {
              $inc: { followersCount: -1 },
            }
          );
          const removeUserFromAdminPages = Page.updateMany(
            {
              _id: {
                $or: authUser.adminPages,
              },
            },
            {
              $pull: {
                admins: authUser._id,
              },
            }
          );

          const ownedPagesAdminIDs = authUser.ownedPages
            .map(
              (page: PageType) =>
                (page as unknown as { admins: string[] }).admins
            )
            .flat(Infinity);

          const removeAdminsFromOwnedPages = User.updateMany(
            {
              _id: {
                $or: ownedPagesAdminIDs,
              },
            },
            {
              $pull: {
                adminPages: {
                  $or: ownedPagesAdminIDs,
                },
              },
            }
          );

          const removeAllFollowersFromOwnedPages = User.updateMany(
            {
              followedPages: {
                $or: authUser.ownedPages.map((page: PageType) => page._id),
              },
            },
            {
              $pull: {
                followedPages: {
                  $or: authUser.ownedPages.map((page: PageType) => page._id),
                },
              },
            }
          );

          const removeOwnedPages = Page.deleteMany({
            _id: {
              $or: authUser.ownedPages.map((page: PageType) => page._id),
            },
          });

          // groups promises
          const removeUserFromFollowedAndAdminGroups = Group.updateMany(
            {
              _id: {
                $or: [...authUser.joinedGroups, ...authUser.adminGroups],
              },
            },
            {
              $pull: {
                admins: authUser._id,
              },
              $inc: { membersCount: -1 },
            }
          );

          const ownedGroupsAdminIDs = authUser.ownedGroups
            .map(
              (page: PageType) =>
                (page as unknown as { admins: string[] }).admins
            )
            .flat(Infinity);

          const removeAdminsFromOwnedGroups = User.updateMany(
            {
              _id: {
                $or: ownedGroupsAdminIDs,
              },
            },
            {
              $pull: {
                adminGroups: {
                  $or: ownedGroupsAdminIDs,
                },
              },
            }
          );

          const removeAllFollowersFromOwnedGroups = User.updateMany(
            {
              followedGroups: {
                $or: authUser.ownedGroups.map((group: GroupType) => group._id),
              },
            },
            {
              $pull: {
                followedGroups: {
                  $or: authUser.ownedGroups.map(
                    (group: GroupType) => group._id
                  ),
                },
              },
            }
          );

          const removeOwnedGroups = Group.deleteMany({
            _id: {
              $or: authUser.ownedGroups.map((group: GroupType) => group._id),
            },
          });

          // posts promises
          const ownedPosts = (
            authUser as unknown as {
              allPosts: {
                post: Record<"owner" | "_id", typeof Types.ObjectId>;
              }[];
            }
          ).allPosts.filter(
            (post) => post.post.owner.toString() === authUser._id
          );

          const getPostsMediaIDs = Post.find({
            $or: [
              {
                _id: {
                  $or: ownedPosts.map((post) => post.post._id),
                },
              },
              {
                communityId: [
                  ...authUser.ownedPages.map((page: PageType) => page._id),
                  ...authUser.ownedGroups.map((group: GroupType) => group._id),
                ],
              },
            ],
          }).select("media");

          const removePostsFromUsersSavedPosts = User.updateMany(
            {
              savedPosts: {
                $or: ownedPosts.map((post) => post.post._id),
              },
            },
            {
              $pull: {
                savedPosts: {
                  $or: ownedPosts.map((post) => post.post._id),
                },
              },
            }
          );

          const removeUserPosts = Post.deleteMany({
            $or: [
              {
                _id: {
                  $or: ownedPosts.map((post) => post.post._id),
                },
              },
              {
                communityId: [
                  ...authUser.ownedPages.map((page: PageType) => page._id),
                  ...authUser.ownedGroups.map((group: GroupType) => group._id),
                ],
              },
            ],
          });

          // comments promises
          const getCommentsMediaIDs = Comment.find({
            $or: [
              { owner: authUser._id },
              { post: ownedPosts.map((post) => post.post._id) },
              {
                communityId: [
                  ...authUser.ownedPages.map((page: PageType) => page._id),
                  ...authUser.ownedGroups.map((group: GroupType) => group._id),
                ],
              },
            ],
          }).select("media");

          const removeUserComments = Comment.deleteMany({
            $or: [
              { owner: authUser._id },
              { post: ownedPosts.map((post) => post.post._id) },
              {
                communityId: [
                  ...authUser.ownedPages.map((page: PageType) => page._id),
                  ...authUser.ownedGroups.map((group: GroupType) => group._id),
                ],
              },
            ],
          });

          // stories promises
          const getStoriesMediaIDs = Story.find({ owner: authUser._id }).select(
            "media"
          );

          const removeUserStories = Story.deleteMany({
            owner: authUser._id,
          });

          // sending the promises
          const [storiesMedia, commentsMedia, postsMedia] =
            await Promise.allSettled([
              // get media promises
              getStoriesMediaIDs,
              getCommentsMediaIDs,
              getPostsMediaIDs,

              // pages
              removeUserFromFollowedPages,
              removeUserFromAdminPages,
              removeAdminsFromOwnedPages,
              removeAllFollowersFromOwnedPages,
              removeOwnedPages,

              // groups
              removeUserFromFollowedAndAdminGroups,
              removeAdminsFromOwnedGroups,
              removeAllFollowersFromOwnedGroups,
              removeOwnedGroups,

              // posts
              removePostsFromUsersSavedPosts,
            ]);

          const allMedia = [
            authUser.profilePicture?.public_id,
            authUser.coverPicture?.public_id,

            ...authUser.ownedGroups
              .map((group: GroupType) => {
                const theGroup = group as Pick<
                  GroupType,
                  "_id" | "admins" | "coverPicture" | "profilePicture"
                >;

                return [
                  theGroup.profilePicture?.public_id,
                  theGroup.coverPicture?.public_id,
                ];
              })
              .flat(Infinity),

            ...authUser.ownedPages
              .map((page: PageType) => {
                const thePage = page as Pick<
                  PageType,
                  "_id" | "admins" | "coverPicture" | "profilePicture"
                >;

                return [
                  thePage.profilePicture?.public_id,
                  thePage.coverPicture?.public_id,
                ];
              })
              .flat(Infinity),
          ].filter(Boolean) as string[];

          [storiesMedia, commentsMedia, postsMedia].forEach((mediaArr) => {
            if (mediaArr.status === "fulfilled") {
              allMedia.push(
                ...mediaArr.value
                  .filter(Boolean)
                  .map((media: ImageType) => media.public_id)
              );
            }
          });

          const removeAllMediaPromise = deleteMedia(allMedia);

          // sending delete promises
          await Promise.allSettled([
            // media
            removeAllMediaPromise,

            // posts
            removeUserPosts,

            // comments
            removeUserComments,

            // stories
            removeUserStories,
          ]);

          return { message: "your account deleted successfully" };
        },
      }),

    removeUserProfileOrCoverPicture: async (
      _: unknown,
      { pictureType }: { pictureType: "profile" | "cover" },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg: `something went wrong while remove your ${pictureType} picture`,
        async resolveCallback(user) {
          if (!pictureType) {
            throw new GraphQLError(
              "you must select one of cover or profile pictures to delete one of them",
              {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              }
            );
          }

          const pictureId = (
            user[
              `${pictureType}Picture` as keyof typeof user
            ] as ImageType | null
          )?.public_id;

          if (!pictureId) {
            throw new GraphQLError(
              `you don't have ${pictureType} picture to remove it`,
              {
                extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
              }
            );
          }

          try {
            await deleteMedia([pictureId]);

            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  [`${pictureType}Picture`]: null,
                },
              }
            );

            return {
              message: `your ${pictureType} picture removed successfully`,
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            throw new GraphQLError(
              `something went wrong while removing your ${pictureType} picture`,
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }
        },
      }),
  },
};

export default userResolvers;
