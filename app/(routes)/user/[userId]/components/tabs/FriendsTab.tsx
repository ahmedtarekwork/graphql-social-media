// nextjs
import { useParams } from "next/navigation";

// react
import { useContext, useEffect, useState } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import Friends from "@/components/friends/Friends";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

const FriendsTab = () => {
  const { user } = useContext(authContext);
  const userIdParam = useParams()?.userId;

  const isCurrentUserProfile = useIsCurrentUserProfile();

  const [profileOwnerId, setProfileOwnerId] = useState(
    isCurrentUserProfile ? user!._id : userIdParam
  );

  useEffect(() => {
    setProfileOwnerId(isCurrentUserProfile ? user!._id : userIdParam);
  }, [user, userIdParam, isCurrentUserProfile]);

  return <Friends mode="ROW" userId={profileOwnerId as string} />;
};
export default FriendsTab;
