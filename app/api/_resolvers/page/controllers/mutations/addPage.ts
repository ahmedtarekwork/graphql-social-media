// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Page from "../../../../_models/page.model";
import User from "../../../../_models/page.model";

// types
import { APIContextFnType, PageType } from "@/lib/types";

const addPage = async (
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
};

export default addPage;
