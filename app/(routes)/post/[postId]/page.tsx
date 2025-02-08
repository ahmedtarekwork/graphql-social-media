"use client";

// nextjs
import { useParams } from "next/navigation";

// components
import Loading from "@/components/Loading";
import PostCard from "@/components/Posts/PostCard";
import IllustrationPage from "@/components/IllustrationPage";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import _404SVG from "/public/illustrations/404.svg";
import emptySVG from "/public/illustrations/empty.svg";

const GET_SINGLE_POST = gql`
  query GetSinglePost($postId: ID!) {
    getSinglePost(postId: $postId) {
      _id
      blockComments
      isInBookMark
      caption
      commentsCount
      privacy
      shareDate
      community
      isShared

      media {
        secure_url
        public_id
      }
      owner {
        profilePicture {
          secure_url
        }
        username
        _id
      }

      shareData {
        count
      }

      reactions {
        angry {
          count
        }
        like {
          count
        }
        love {
          count
        }
        sad {
          count
        }
      }
    }
  }
`;

const SinglePostPage = () => {
  const postId = useParams()?.postId as string;

  const { data, loading, error, updateQuery } = useQuery(GET_SINGLE_POST, {
    variables: { postId },
  });

  if (loading) {
    return <Loading />;
  }

  if (!loading && error) {
    return (
      <IllustrationPage
        content={
          error.graphQLErrors?.[0]?.message ||
          "can't get this post at the momment"
        }
        btn={{ type: "go-to-home" }}
        svg={_404SVG}
      />
    );
  }

  if (!loading && !error && !data) {
    return (
      <IllustrationPage
        content={"This post not found"}
        btn={{ type: "go-to-home" }}
        svg={emptySVG}
      />
    );
  }

  return (
    <PostCard
      mode="single"
      updateQuery={updateQuery}
      post={data.getSinglePost}
      TagName="div"
    />
  );
};
export default SinglePostPage;
