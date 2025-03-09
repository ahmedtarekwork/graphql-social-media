// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserAdminInPage from "../../utils/isUserAdminInPage";

// models
import Page from "../../../../_models/page.model";
import User from "../../../../_models/page.model";

// types
import type { APIContextFnType } from "@/lib/types";

const togglePageAdmin = async (
  _: unknown,
  {
    toggleAdminData: { pageId, newAdminId, toggle },
  }: {
    toggleAdminData: Record<"pageId" | "newAdminId", string> & {
      toggle: "add" | "remove";
    };
  },
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
    publicErrorMsg: `something went wrong while ${toggle} admin ${
      toggle === "add" ? "to" : "from"
    } page`,

    async resolveCallback(user) {
      const page = (await Page.findById(pageId).select("owner admins"))?._doc;

      if (!page) {
        throw new GraphQLError("page with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isAdmin = await isUserAdminInPage(newAdminId, pageId);

      if (isAdmin && toggle === "add") {
        throw new GraphQLError(
          "user with given id is already an admin in page",
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }
      if (!isAdmin && toggle === "remove") {
        throw new GraphQLError(
          "user with given id isn't an admin in the page",
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      if (newAdminId === user._id && page.owner.toString() === user._id) {
        throw new GraphQLError(
          "you can't remove your self from group admins because you are the owner"
        );
      }

      if (
        user._id !== page.owner.toString() &&
        // each admin can remove him self from admins list
        user._id !== newAdminId &&
        !isAdmin
      ) {
        throw new GraphQLError("page owner only can add or remove admins", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      await Page.updateOne(
        { _id: pageId },
        {
          [`$${isAdmin ? "pull" : "push"}`]: {
            admins: newAdminId,
          },
        }
      );

      await User.updateOne(
        { _id: newAdminId },
        {
          [`$${isAdmin ? "pull" : "push"}`]: {
            adminPages: newAdminId,
          },
        }
      );

      return {
        message:
          newAdminId === user._id && isAdmin
            ? "you are successfully removed your self from page admins list"
            : `admin ${isAdmin ? "removed" : "added"} successfully`,
      };
    },
  });
};

export default togglePageAdmin;
