// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Page from "../../../../_models/page.model";

// utils
import isUserAdminInPageFn from "../../utils/isUserAdminInPage";
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

// types
import { APIContextFnType, ImageType } from "@/lib/types";

const removePageProfileOrCoverPicture = async (
  _: unknown,
  {
    removePictureInfo: { pictureType, pageId },
  }: {
    removePictureInfo: { pictureType: "profile" | "cover"; pageId: string };
  },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg: `something went wrong while remove page ${pictureType} picture`,
    async resolveCallback(user) {
      const pictureName = `${pictureType}Picture`;

      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      if (!pictureType) {
        throw new GraphQLError(
          "you must select one of cover or profile pictures to delete one of them",
          {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          }
        );
      }

      const page = await Page.findById(pageId).select(`owner ${pictureName}`);

      if (!page) {
        throw new GraphQLError("page with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInPage = await isUserAdminInPageFn(user._id, pageId);

      if (page.owner.toString() !== user._id.toString() && !isUserAdminInPage) {
        throw new GraphQLError(
          `page owner or admins can only remove page ${pictureType} picture`,
          { extensions: { code: "FORBIDDEN" } }
        );
      }

      const pictureId = (
        page[`${pictureType}Picture` as keyof typeof user] as ImageType | null
      )?.public_id;

      if (!pictureId) {
        throw new GraphQLError(
          `this page dosen't have ${pictureType} picture to remove it`,
          {
            extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
          }
        );
      }

      try {
        await deleteMedia([pictureId]);

        await Page.updateOne(
          { _id: pageId },
          { $set: { [pictureName]: null } }
        );

        return {
          message: `page ${pictureType} picture removed successfully`,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        throw new GraphQLError(
          `something went wrong while removing page ${pictureType} picture`,
          {
            extensions: {
              code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
            },
          }
        );
      }
    },
  });
};
export default removePageProfileOrCoverPicture;
