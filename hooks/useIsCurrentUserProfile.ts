// nextjs
import { useParams } from "next/navigation";

// react
import { useContext, useEffect, useState } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

const useIsCurrentUserProfile = () => {
  const { user } = useContext(authContext);

  const userId = useParams()?.userId;

  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(
    ["profile", user?._id || ""].includes(userId as string)
  );

  useEffect(() => {
    setIsCurrentUserProfile(
      ["profile", user?._id || ""].includes(userId as string)
    );
  }, [user, userId]);

  return isCurrentUserProfile;
};

export default useIsCurrentUserProfile;
