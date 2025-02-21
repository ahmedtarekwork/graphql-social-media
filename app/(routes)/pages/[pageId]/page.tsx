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
import type { PageType } from "@/lib/types";
import { type ProfileAndCoverPictureRefType } from "@/components/profiles/ProfileAndCoverPicture";

const GET_SINGLE_PAGE = gql`
  query GetPageInfo($pageId: ID!) {
    getPageInfo(pageId: $pageId) {
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
      followersCount
      owner {
        _id
      }
    }
  }
`;

const IS_USER_ADMIN_IN_PAGE = gql`
  query IsUserAdminInPage($pageId: ID!) {
    isUserAdminInPage(pageId: $pageId) {
      isUserAdminInPage
    }
  }
`;

const SinglePagePage = () => {
  const pageId = useParams()?.pageId;

  const { loading, data, error, updateQuery } = useQuery(GET_SINGLE_PAGE, {
    variables: { pageId },
  });

  const { user } = useContext(authContext);

  const {
    loading: getIsUserAdminLoading,
    data: getIsUserAdminData,
    updateQuery: isUserAdminUpdateQuery,
  } = useQuery(IS_USER_ADMIN_IN_PAGE, { variables: { pageId } });

  const isUserAdmin = getIsUserAdminData?.isUserAdminInPage?.isUserAdminInPage;
  const pageInfo = data?.getPageInfo as PageType;
  const isUserOwner =
    (pageInfo as PageType)?.owner?._id?.toString() === user?._id?.toString();

  const normalUser = !getIsUserAdminLoading && !isUserOwner && !isUserAdmin;

  const coverPictureRef = useRef<ProfileAndCoverPictureRefType>(null);
  const profilePictureRef = useRef<ProfileAndCoverPictureRefType>(null);
  const skipCount = useRef(0);

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const [stopFetchMore, setStopFetchMore] = useState(false);

  if (!pageId) {
    return (
      <IllustrationPage
        content="page id is required"
        btn={{ type: "go-to-home" }}
        svg={IDSVG}
      />
    );
  }

  if (loading) return <Loading />;

  if (!loading && (error || !pageInfo)) {
    return (
      <IllustrationPage
        content="can't get this page info at the momment"
        btn={{ type: "go-to-home" }}
        svg={_404}
      />
    );
  }

  return (
    <div className="-mt-4">
      <ProfileTopInfo
        updateQuery={updateQuery}
        profileType="page"
        coverPictureRef={coverPictureRef}
        profilePictureRef={profilePictureRef}
        profileInfo={pageInfo}
        isUserAdminUpdateQuery={isUserAdminUpdateQuery}
        normalUser={normalUser}
        isUserOwner={isUserOwner}
      />
      <div className="bg-primary h-0.5" />

      <div className="space-y-2 mt-2">
        <PostsProvider>
          {!normalUser && (
            <PostForm
              profileInfo={pageInfo}
              profileType="page"
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
export default SinglePagePage;
