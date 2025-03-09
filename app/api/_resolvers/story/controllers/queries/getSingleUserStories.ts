// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { GraphQLError } from "graphql";

// models
import Story from "../../../../_models/story.model";
import User from "../../../../_models/user.model";

const getSingleUserStories = async (
  _: unknown,
  { userId }: { userId: string }
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting this user stories",
    async resolveCallback() {
      if (!(await User.exists({ _id: userId }))) {
        throw new GraphQLError("user with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const stories = await Story.find({ owner: userId });

      if (!stories) {
        throw new GraphQLError(
          "something went wrong while getting this user stories"
        );
      }

      return stories;
    },
  });
};

export default getSingleUserStories;
