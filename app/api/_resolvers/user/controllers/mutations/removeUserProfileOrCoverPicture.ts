// types
import type { APIContextFnType, ImageType } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import User from "../../../../_models/user.model";

const removeUserProfileOrCoverPicture = async (
  _: unknown,
  { pictureType }: { pictureType: "profile" | "cover" },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
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
        user[`${pictureType}Picture` as keyof typeof user] as ImageType | null
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
  });
};

export default removeUserProfileOrCoverPicture;
