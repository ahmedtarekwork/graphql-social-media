// utils
import connectDB from "@/lib/connectDB";
import validateToken from "@/lib/validateToken";

// models
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType } from "@/lib/types";

const checkUser = async (
  _: unknown,
  __: unknown,
  { req }: APIContextFnType
) => {
  await connectDB();
  const user = await validateToken(req, (userId) =>
    User.findById(userId)
      .select("_id username profilePicture coverPicture email address")
      .populate([
        {
          path: "followedPages joinedGroups ownedPages adminPages ownedGroups adminGroups",
          options: { limit: 10 },
        },
      ])
  );

  if (user) {
    return {
      ...user,
      password: undefined,
    };
  } else return;
};

export default checkUser;
