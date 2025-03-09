// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";
import isUserAdminInPageFn from "../../utils/isUserAdminInPage";

// models
import Page from "../../../../_models/page.model";

// types
import type { APIContextFnType, Pagination } from "@/lib/types";

const getPageAdminsList = async (
  _: unknown,
  {
    paginationData: { pageId, limit = 0, page = 1, skip = 0 },
  }: { paginationData: Pagination<{ pageId: string; skip: number }> },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg: "something went wrong while getting page admins list",
    async resolveCallback(user) {
      const mainSkipCount = (page - 1) * limit;

      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const pageDoc = await Page.findById(pageId).select("owner");

      if (!pageDoc) {
        throw new GraphQLError("page with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInPage = await isUserAdminInPageFn(user._id, pageId);

      if (
        pageDoc.owner.toString() !== user._id.toString() &&
        !isUserAdminInPage
      ) {
        throw new GraphQLError(
          "page owner or admins can only the admins list of page",
          { extensions: { code: "FORBIDDEN" } }
        );
      }

      const adminsList = await Page.aggregate([
        { $match: { _id: new Types.ObjectId(pageId) } },
        {
          $facet: {
            adminsCount: [
              {
                $project: {
                  adminsCount: {
                    $size: "$admins",
                  },
                },
              },
            ],

            admins: [
              { $unwind: "$admins" },
              {
                $skip: mainSkipCount + skip < 0 ? 0 : mainSkipCount + skip,
              },
              { $limit: limit },

              {
                $lookup: {
                  from: "users",
                  localField: "admins",
                  foreignField: "_id",
                  as: "adminInfo",
                },
              },

              {
                $unwind: "$adminInfo",
              },

              {
                $project: {
                  _id: 0,
                  adminInfo: {
                    _id: 1,
                    username: 1,
                    profilePicture: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  admins: {
                    $push: "$adminInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      const adminsCount = adminsList?.[0]?.adminsCount?.[0]?.adminsCount || 0;
      const admins = adminsList?.[0]?.admins?.[0]?.admins || [];

      return {
        admins,
        isFinalPage: page * limit >= adminsCount,
      };
    },
  });
};

export default getPageAdminsList;
