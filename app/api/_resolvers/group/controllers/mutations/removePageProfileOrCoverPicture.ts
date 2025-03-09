// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { deleteMedia } from "@/lib/utils";
import handleConnectDB from "@/lib/handleConnectDB";
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";

// models
import Group from "../../../../_models/group.model";

// types
import type { APIContextFnType, ImageType } from "@/lib/types";

const removePageProfileOrCoverPicture = async (
  _: unknown,
  {
    removePictureInfo: { pictureType, groupId },
  }: {
    removePictureInfo: {
      pictureType: "profile" | "cover";
      groupId: string;
    };
  },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg: `something went wrong while remove group ${pictureType} picture`,
    async resolveCallback(user) {
      const pictureName = `${pictureType}Picture`;

      if (!groupId) {
        throw new GraphQLError("group id is required", {
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

      const group = await Group.findById(groupId).select(
        `owner ${pictureName}`
      );

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInGroup = await isUserAdminInGroupFn(user._id, groupId);

      if (
        group.owner.toString() !== user._id.toString() &&
        !isUserAdminInGroup
      ) {
        throw new GraphQLError(
          `group owner or admins can only remove group ${pictureType} picture`,
          { extensions: { code: "FORBIDDEN" } }
        );
      }

      const pictureId = (
        group[`${pictureType}Picture` as keyof typeof user] as ImageType | null
      )?.public_id;

      if (!pictureId) {
        throw new GraphQLError(
          `this group dosen't have ${pictureType} picture to remove it`,
          {
            extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
          }
        );
      }

      try {
        await deleteMedia([pictureId]);

        await Group.updateOne(
          { _id: groupId },
          { $set: { [pictureName]: null } }
        );

        return {
          message: `group ${pictureType} picture removed successfully`,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        throw new GraphQLError(
          `something went wrong while removing group ${pictureType} picture`,
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
