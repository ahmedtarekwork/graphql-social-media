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
import JoinGroupBtns from "@/components/groups/JoinGroupBtns";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import IDSVG from "/public/illustrations/ID_Card.svg";
import _404 from "/public/illustrations/404.svg";
import worldSVG from "/public/illustrations/online-world.svg";

// types
import type { GroupType } from "@/lib/types";
import { type ProfileAndCoverPictureRefType } from "@/components/profiles/ProfileAndCoverPicture";

const GET_SINGLE_GROUP = gql`
  query GetSingleGroup($groupId: ID!) {
    getSingleGroup(groupId: $groupId) {
      _id
      name
      privacy
      profilePicture {
        secure_url
        public_id
        _id
      }
      coverPicture {
        secure_url
        public_id
        _id
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

const IS_USER_MEMBER_IN_GROUP = gql`
  query IsUserMemberInGroup($groupId: ID!) {
    isUserMemberInGroup(groupId: $groupId) {
      isUserMemberInGroup
    }
  }
`;

const SingleGroupPage = () => {
  const groupId = useParams()?.groupId;

  const { user } = useContext(authContext);

  const { loading, data, error, updateQuery } = useQuery(GET_SINGLE_GROUP, {
    variables: { groupId },
  });

  const {
    loading: getIsUserAdminLoading,
    data: getIsUserAdminData,
    updateQuery: isUserAdminUpdateQuery,
  } = useQuery(IS_USER_ADMIN_IN_GROUP, { variables: { groupId } });

  const {
    loading: isUserMemberLoading,
    data: isUserMemberData,
    updateQuery: isUserMemberInGroupUpdateQuery,
  } = useQuery(IS_USER_MEMBER_IN_GROUP, { variables: { groupId } });

  const isUserMember =
    isUserMemberData?.isUserMemberInGroup?.isUserMemberInGroup;

  const isUserAdmin =
    getIsUserAdminData?.isUserAdminInGroup?.isUserAdminInGroup;

  const groupInfo = data?.getSingleGroup as GroupType;
  const isUserOwner =
    (groupInfo as GroupType)?.owner?._id?.toString() === user?._id?.toString();

  const normalUser = !getIsUserAdminLoading && !isUserOwner && !isUserAdmin;
  const lockContent =
    groupInfo?.privacy === "members_only" && !isUserMember && normalUser;

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
        isMember={isUserMember}
        isUserMemberInGroupUpdateQuery={isUserMemberInGroupUpdateQuery}
      />
      <div className="bg-primary h-0.5" />

      {(getIsUserAdminLoading || isUserMemberLoading) && (
        <div className="mt-2">
          <Loading />
        </div>
      )}

      {!getIsUserAdminLoading && !isUserMemberLoading && (
        <>
          {(groupInfo.privacy === "public" || !lockContent) && (
            <div className="space-y-2 mt-2">
              <PostsProvider>
                {(!normalUser || isUserMember) && (
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
                  mode="singleGroupInfoPage"
                  setFetchMoreLoading={setFetchMoreLoading}
                  setStopFetchMore={setStopFetchMore}
                  stopFetchMore={stopFetchMore}
                  skipCount={skipCount}
                  normalUser={normalUser}
                />
              </PostsProvider>
            </div>
          )}

          {lockContent && (
            <IllustrationPage
              content={
                <>
                  you can{"'"}t see this group posts because it{"'"}s not a
                  public group, you can send a request to join the group.
                </>
              }
              svg={worldSVG}
              btn={{
                type: "custom",
                component: (
                  <div className="mx-auto w-fit">
                    <JoinGroupBtns
                      groupPrivacy={groupInfo.privacy}
                      isMember={isUserMember}
                      isUserMemberInGroupUpdateQuery={
                        isUserMemberInGroupUpdateQuery
                      }
                    />
                  </div>
                ),
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
export default SingleGroupPage;
