"use client";

// next
import { useParams } from "next/navigation";

// react
import { useContext, useEffect } from "react";

// context
import { authContext } from "@/contexts/AuthContext";

// components
import IllustrationPage from "@/components/IllustrationPage";
import Loading from "@/components/Loading";
import PostForm from "@/components/Posts/postForm/PostForm";

// SVGs
import ID_Card_SVG from "/public/illustrations/ID_Card.svg";
import errorLaptopSVG from "/public/illustrations/error-laptop.svg";
import _403SVG from "/public/illustrations/403.svg";

// gql
import { gql, useLazyQuery } from "@apollo/client";

const GET_SINGLE_POST = gql`
  query GetSinglePost($postId: ID!) {
    getSinglePost(postId: $postId) {
      _id
      caption
      media {
        public_id
        secure_url
      }
      privacy
      community
      blockComments

      owner {
        _id
      }
    }
  }
`;

const EditPostPage = () => {
  const postId = useParams()?.postId as string;

  const { user } = useContext(authContext);

  const [getSinglePost, { data, loading, error, client }] = useLazyQuery(
    GET_SINGLE_POST,
    { variables: { postId } }
  );

  useEffect(() => {
    if (postId) getSinglePost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (!postId || typeof postId !== "string") {
    return (
      <IllustrationPage
        svg={ID_Card_SVG}
        content={!postId ? "post id is required" : "post id not valid"}
        btn={{ type: "go-to-home" }}
      />
    );
  }

  if (loading) return <Loading />;

  if (!loading && !data && error) {
    return (
      <IllustrationPage
        svg={errorLaptopSVG}
        content={
          error.graphQLErrors?.[0]?.message ||
          "can't find this post at the momment"
        }
        btn={{ type: "go-to-home" }}
      />
    );
  }

  if (!data) {
    return (
      <IllustrationPage
        svg={errorLaptopSVG}
        btn={{ type: "go-to-home" }}
        content="something went wrong, try again later"
      />
    );
  }

  if (data.getSinglePost.owner._id !== user!._id) {
    return (
      <IllustrationPage
        content="you are not the owner of this post, post owner only can update the post"
        btn={{ type: "go-to-home" }}
        svg={_403SVG}
      />
    );
  }

  console.log(data);

  return (
    <div className="my-4">
      <PostForm mode="edit" oldPostInfo={{ loading, data, error, client }} />
    </div>
  );
};
export default EditPostPage;
