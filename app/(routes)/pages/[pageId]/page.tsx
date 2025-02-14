"use client";

// nextjs
import { useParams } from "next/navigation";

// react
import { useRef } from "react";

// components
import IllustrationPage from "@/components/IllustrationPage";
import ProfileTopInfo from "@/components/profiles/ProfileTopInfo";
import Loading from "@/components/Loading";

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
      }
      coverPicture {
        secure_url
      }
      followersCount
      owner {
        _id
      }
    }
  }
`;

// const GET_PAGE_POSTS = gql`
// query
// `
// const IS_USER_FOLLOW_THIS_PAGE = gql`
// query
// `

const SinglePagePage = () => {
  const pageId = useParams()?.pageId;

  const coverPictureRef = useRef<ProfileAndCoverPictureRefType>(null);
  const profilePictureRef = useRef<ProfileAndCoverPictureRefType>(null);

  const { loading, data, error, updateQuery } = useQuery(GET_SINGLE_PAGE, {
    variables: { pageId },
  });

  const pageInfo = data?.getPageInfo as PageType;

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

  console.log(pageInfo);
  return (
    <div className="-mt-4">
      <ProfileTopInfo
        updateQuery={updateQuery}
        profileType="page"
        coverPictureRef={coverPictureRef}
        profilePictureRef={profilePictureRef}
        pageInfo={pageInfo}
      />
      <div className="bg-primary h-0.5" />
    </div>
  );
};
export default SinglePagePage;
