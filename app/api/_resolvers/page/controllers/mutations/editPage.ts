// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Page from "../../../../_models/page.model";

// utils
import isUserAdminInPageFn from "../../utils/isUserAdminInPage";
import handleConnectDB from "@/lib/handleConnectDB";

// types
import type { APIContextFnType, PageType } from "@/lib/types";

const editPage = async (
  _: unknown,
  {
    editPageData: { pageId, ...editPageData },
  }: {
    editPageData: { pageId: string } & Pick<
      PageType,
      "name" | "coverPicture" | "profilePicture"
    >;
  },
  { req }: APIContextFnType
) => {
  const keysArr = ["name", "coverPicture", "profilePicture"];
  if (!pageId) {
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
      const page = (await Page.findById(pageId).select("owner"))?._doc;

      if (!page) {
        throw new GraphQLError("page with given id not found", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      const isUserAdminInPage = await isUserAdminInPageFn(user._id, pageId);

      if (user._id !== page.owner.toString() && !isUserAdminInPage) {
        throw new GraphQLError(
          "page owner or admins can only update page info",
          {
            extensions: { code: "FORBIDDEN" },
          }
        );
      }

      await Page.updateOne({ _id: pageId }, { $set: editPageData });

      return { message: "page updated successfully" };
    },
  });
};

export default editPage;
