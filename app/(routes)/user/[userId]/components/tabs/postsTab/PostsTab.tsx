// react
import { useRef, useState } from "react";

// components
import FriendsSection from "./components/FriendsSection";
import PostForm from "../../../../../../../components/Posts/postForm/PostForm";
import PostsPreviewer from "@/components/Posts/PostsPreviewer";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

// types
import type { UserType } from "@/lib/types";

type Props = {
  profileOwner: UserType;
};

const PostsTab = ({ profileOwner }: Props) => {
  const isCurrentUserProfile = useIsCurrentUserProfile();

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const [stopFetchMore, setStopFetchMore] = useState(false);

  const skipCount = useRef(0);

  return (
    <div className="flex gap-2">
      <div className="md:basis-[70%] max-md:flex-1 space-y-3">
        <h2 className="text-primary underline font-bold text-2xl">
          {isCurrentUserProfile ? "Your" : "Available"} Posts
        </h2>

        {/* add new post section */}
        {isCurrentUserProfile && (
          <PostForm
            profileType="personal"
            mode="new"
            skipCount={skipCount}
            fetchMoreLoading={fetchMoreLoading}
            setStopFetchMore={setStopFetchMore}
            homePage={false}
          />
        )}

        <PostsPreviewer
          mode="profilePage"
          stopFetchMore={stopFetchMore}
          setStopFetchMore={setStopFetchMore}
          profileOwner={profileOwner}
          skipCount={skipCount}
          isCurrentUserProfile={isCurrentUserProfile}
          fetchMoreLoading={fetchMoreLoading}
          setFetchMoreLoading={setFetchMoreLoading}
        />
      </div>

      {/* friends section */}
      <FriendsSection />
    </div>
  );
};
export default PostsTab;
