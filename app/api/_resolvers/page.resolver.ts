// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import User from "../_models/user.model";
import Page from "../_models/page.model";

// types
import type { APIContextFnType, PageType, Pagination } from "@/lib/types";

const pageResolvers = {
  Query: {
    getPageInfo: async (_: unknown, { pageId }: { pageId: string }) => {
      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        publicErrorMsg: "can't get page info at the momment",
        async resolveCallback() {
          const page = await Page.findById(pageId).populate({
            path: "owner",
            select: "_id",
          });

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return page;
        },
      });
    },
    getAllPages: async (
      _: unknown,
      {
        wantedPageData: { page = 1, limit = 0 },
      }: { wantedPageData: Pagination }
    ) => {
      return await handleConnectDB({
        publicErrorMsg: "can't get pages info at the momment",
        async resolveCallback() {
          const pages = await Page.find()
            .limit(limit)
            .skip((page - 1) * limit);

          if (!pages) {
            throw new GraphQLError(
              "something went wrong while get some pages",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          return pages;
        },
      });
    },
  },

  Mutation: {
    togglePageFollow: async (
      _: unknown,
      { pageId }: { pageId: string },
      { req }: APIContextFnType
    ) => {
      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while do this operation",
        async resolveCallback(user) {
          const page = (await Page.findById(pageId))?.doc;

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserFollowingPage = (
            user as unknown as { followedPages: (typeof Types.ObjectId)[] }
          ).followedPages.some((id) => id.toString() === pageId);

          const isUserAdmin = page.admins.some(
            (id: typeof Types.ObjectId) => id.toString() === user._id
          );

          const removeUserFromPageFollowersData = {
            [`$${isUserFollowingPage ? "pull" : "push"}`]: {
              followedPages: pageId,
            },
          } as Record<string, unknown>;

          if (isUserAdmin && isUserFollowingPage) {
            removeUserFromPageFollowersData.$pull = { adminPages: pageId };
          }

          const newUserData = (
            await User.findByIdAndUpdate(
              user._id,
              removeUserFromPageFollowersData,
              { new: true }
            ).select("followedPages")
          )?._doc?.followedPages;

          if (!newUserData) {
            throw new GraphQLError(
              `something went wrong while ${
                isUserFollowingPage ? "un" : ""
              }follow the page`,
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          const updatedPageData = {
            $inc: {
              followersCount: isUserFollowingPage ? -1 : 1,
            },
          } as Record<string, unknown>;

          if (isUserFollowingPage && isUserAdmin) {
            updatedPageData.$pull = { admins: user._id };
          }

          await Page.updateOne({ _id: pageId }, updatedPageData);

          return newUserData;
        },
      });
    },

    togglePageAdmin: async (
      _: unknown,
      {
        toggleAdminData: { pageId, newAdminId },
      }: { toggleAdminData: Record<"pageId" | "newAdminId", string> },
      { req }: APIContextFnType
    ) => {
      if (!pageId || !newAdminId) {
        throw new GraphQLError(
          `${!newAdminId ? "admin id" : "page id"} is required`,
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while handle your order",

        async resolveCallback(user) {
          const page = (await Page.findById(pageId))?._doc;

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isAdmin = page.admins.some(
            (id: typeof Types.ObjectId) => id.toString() === newAdminId
          );

          if (newAdminId === user._id && isAdmin) {
            await Page.updateOne(
              { _id: pageId },
              { $pull: { admins: user._id } }
            );

            await User.updateOne(
              { _id: newAdminId },
              { $pull: { adminPages: newAdminId } }
            );

            return {
              message:
                "you are successfully removed your self from page admins",
            };
          }

          if (newAdminId === user._id && page.owner.toString() === user._id) {
            throw new GraphQLError(
              "you can't remove your self from group admins because you are the owner"
            );
          }

          if (user._id !== page.owner.toString()) {
            throw new GraphQLError("page owner only can add admins", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          if (user._id === newAdminId && user._id === page.owner.toString()) {
            throw new GraphQLError(
              "you can't do this operation because you are the owner",
              {
                extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
              }
            );
          }

          if (!isAdmin) {
            const user = (
              await User.findById(newAdminId).select("followedPages")
            )?._doc;

            if (!user) {
              throw new GraphQLError("admin with given id not found", {
                extensions: { code: "NOT_FOUND" },
              });
            }

            const isFollower = user.followedPages.some(
              (id: typeof Types.ObjectId) => id.toString() === pageId
            );

            if (!isFollower) {
              throw new GraphQLError(
                "user must be follower to the page before make him admin",
                { extensions: { code: "FORBIDDEN" } }
              );
            }
          }

          const newAdminsList = (
            await Page.findByIdAndUpdate(
              pageId,
              {
                [`$${isAdmin ? "pull" : "push"}`]: {
                  admins: newAdminId,
                },
              },
              { new: true }
            ).select("admins")
          )?._doc.admins;

          await User.updateOne(
            { _id: newAdminId },
            {
              [`$${isAdmin ? "pull" : "push"}`]: {
                adminPages: newAdminId,
              },
            }
          );

          return {
            message: `admin ${isAdmin ? "removed" : "added"} successfully`,
            newAdminsList,
          };
        },
      });
    },

    addPage: async (
      _: unknown,
      {
        pageData,
      }: {
        pageData: Pick<PageType, "name" | "coverPicture" | "profilePicture">;
      },
      { req }: APIContextFnType
    ) => {
      if (!pageData.name) {
        throw new GraphQLError("page name is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while create the page",
        async resolveCallback(user) {
          const page = (
            await Page.create({
              ...pageData,
              owner: user._id,
            })
          )?._id;

          await User.updateOne(
            { _id: user._id },
            { $push: { ownedPages: page._id } }
          );

          return page;
        },
      });
    },

    editPage: async (
      _: unknown,
      {
        editPageData,
      }: {
        editPageData: { pageId: string } & Pick<
          PageType,
          "name" | "coverPicture" | "profilePicture"
        >;
      },
      { req }: APIContextFnType
    ) => {
      const keysArr = ["name", "coverPicture", "profilePicture"];
      if (!editPageData.pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!editPageData || keysArr.every((key) => !(key in editPageData))) {
        throw new GraphQLError("you must provide some data to update page", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while update page info",
        async resolveCallback(user) {
          const page = (await Page.findById(editPageData.pageId))?._doc;

          if (user._id !== page.owner.toString()) {
            throw new GraphQLError("you aren't the page owner", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          // const newPageData = (
          await Page.updateOne(
            { _id: editPageData.pageId },
            { $set: editPageData }
            // { new: true }
          );
          // )?._doc;

          return { message: "page updated successfully" };
        },
      });
    },

    deletePage: async (
      _: unknown,
      { pageId }: { pageId: string },
      { req }: APIContextFnType
    ) => {
      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while deleting the page",
        async resolveCallback(user) {
          const page = (await Page.findById(pageId))?._doc;

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (user._id !== page.owner.toString()) {
            throw new GraphQLError("you aren't the page owner", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          await Page.deleteOne({ _id: pageId });

          const removeOwnerFromPage = User.updateOne(
            { _id: user._id },
            { $pull: { ownedPages: pageId } }
          );
          const removeAdminsFromPage = User.updateMany(
            {
              _id: { $or: page.admins },
            },
            {
              $pull: {
                adminPages: pageId,
              },
            }
          );
          const removeFollowersFromPage = User.updateMany(
            {
              followedPages: pageId,
            },
            {
              $pull: {
                followedPages: pageId,
              },
            }
          );

          const mediaArr = [
            page.profilePicture?.public_id,
            page.coverPicture?.public_id,
          ].filter(Boolean);

          const promisesArr: Promise<unknown>[] = [
            removeOwnerFromPage,
            removeAdminsFromPage,
            removeFollowersFromPage,
          ];
          if (mediaArr.length) promisesArr.push(deleteMedia(mediaArr));

          await Promise.allSettled(promisesArr);

          return { message: "page deleted successfully" };
        },
      });
    },
  },
};

export default pageResolvers;
