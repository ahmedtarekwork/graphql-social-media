// types
import type {
  APIContextFnType,
  ImageType,
  ReqUserType,
  UserType,
} from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { GraphQLError } from "graphql";
import { compare } from "bcrypt";

// models
import User from "../../../../_models/user.model";

const changeUserData = async (
  _: unknown,
  { newUserData }: { newUserData: Partial<ReqUserType> },
  { req }: APIContextFnType
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
    async resolveCallback(user) {
      const checkForSameUsernameOrEmail = async (key: "username" | "email") => {
        if (key in newUserData) {
          if (user[key] === newUserData[key]) {
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
          user.password
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
        const oldProfilePicture = user.profilePicture;
        const newProfilePicture = newUserData.profilePicture;

        const oldCoverPicture = user.coverPicture;
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
        user._id,
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
};

export default changeUserData;
