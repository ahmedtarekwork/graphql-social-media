"use client";

// nextjs
import { useParams } from "next/navigation";

// react
import { useContext, useRef, useState } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// providers
import PostsProvider from "@/contexts/PostsContext";

// components
import IllustrationPage from "@/components/IllustrationPage";
import ProfileTopInfo from "@/components/profiles/ProfileTopInfo";
import Loading from "@/components/Loading";
import PostForm from "@/components/Posts/postForm/PostForm";
import PostsPreviewer from "@/components/Posts/PostsPreviewer";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import IDSVG from "/public/illustrations/ID_Card.svg";
import _404 from "/public/illustrations/404.svg";

// types
import type { GroupType } from "@/lib/types";
import { type ProfileAndCoverPictureRefType } from "@/components/profiles/ProfileAndCoverPicture";

const GET_SINGLE_GROUP = gql`
  query GetSingleGroup($groupId: ID!) {
    getSingleGroup(groupId: $groupId) {
      _id
      name
      profilePicture {
        secure_url
        public_id
      }
      coverPicture {
        secure_url
        public_id
      }
      membersCount
      owner {
        _id
      }
    }
  }
`;

const IS_USER_ADMIN_IN_GROUP = gql`
  query IsUserAdminInGroup($groupId: ID!) {
    isUserAdminInGroup(groupId: $groupId) {
      isUserAdminInGroup
    }
  }
`;

const SingleGroupPage = () => {
  const groupId = useParams()?.groupId;

  const { loading, data, error, updateQuery } = useQuery(GET_SINGLE_GROUP, {
    variables: { groupId },
  });

  const { user } = useContext(authContext);

  const {
    loading: getIsUserAdminLoading,
    data: getIsUserAdminData,
    updateQuery: isUserAdminUpdateQuery,
  } = useQuery(IS_USER_ADMIN_IN_GROUP, { variables: { groupId } });

  const isUserAdmin =
    getIsUserAdminData?.isUserAdminInGroup?.isUserAdminInGroup;
  const groupInfo = data?.getSingleGroup as GroupType;
  const isUserOwner =
    (groupInfo as GroupType)?.owner?._id?.toString() === user?._id?.toString();

  const normalUser = !getIsUserAdminLoading && !isUserOwner && !isUserAdmin;

  const coverPictureRef = useRef<ProfileAndCoverPictureRefType>(null);
  const profilePictureRef = useRef<ProfileAndCoverPictureRefType>(null);
  const skipCount = useRef(0);

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const [stopFetchMore, setStopFetchMore] = useState(false);

  if (!groupId) {
    return (
      <IllustrationPage
        content="group id is required"
        btn={{ type: "go-to-home" }}
        svg={IDSVG}
      />
    );
  }

  if (loading) return <Loading />;

  if (!loading && (error || !groupInfo)) {
    return (
      <IllustrationPage
        content="can't get this group info at the momment"
        btn={{ type: "go-to-home" }}
        svg={_404}
      />
    );
  }

  return (
    <div className="-mt-4">
      <ProfileTopInfo
        updateQuery={updateQuery}
        profileType="group"
        coverPictureRef={coverPictureRef}
        profilePictureRef={profilePictureRef}
        profileInfo={groupInfo}
        isUserAdminUpdateQuery={isUserAdminUpdateQuery}
        normalUser={normalUser}
        isUserOwner={isUserOwner}
      />
      <div className="bg-primary h-0.5" />

      <div className="space-y-2 mt-2">
        <PostsProvider>
          {!normalUser && (
            <PostForm
              profileInfo={groupInfo}
              profileType="group"
              mode="new"
              fetchMoreLoading={fetchMoreLoading}
              setStopFetchMore={setStopFetchMore}
              skipCount={skipCount}
              homePage={false}
            />
          )}

          <PostsPreviewer
            fetchMoreLoading={fetchMoreLoading}
            mode="singlePageInfoPage"
            setFetchMoreLoading={setFetchMoreLoading}
            setStopFetchMore={setStopFetchMore}
            stopFetchMore={stopFetchMore}
            skipCount={skipCount}
            normalUser={normalUser}
          />
        </PostsProvider>
      </div>
    </div>
  );
};
export default SingleGroupPage;
