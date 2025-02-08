// react
import { useContext } from "react";

// contexts
import { PostsContext } from "@/contexts/PostsContext";

// components
// shadcn
import { Button } from "../../ui/button";

// icons
import { FaShare } from "react-icons/fa";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

// types
import { type InsideProfileType } from "../PostCard";

type Props = {
  btnVariant: "default" | "ghost";
  postId: string;
  isShared: boolean;
} & Pick<InsideProfileType, "mode" | "updateQuery">;

const SHARE_POST = gql`
  mutation ToggleSharedPost($postId: ID!) {
    toggleSharedPost(postId: $postId) {
      message
    }
  }
`;

const SharePostBtn = ({
  btnVariant,
  postId,
  isShared,
  mode,
  updateQuery,
}: Props) => {
  const { setData } = useContext(PostsContext);

  const [sharePost, { loading }] = useMutation(SHARE_POST, {
    variables: { postId },
    onCompleted(data) {
      if (mode === "profilePage") {
        setData((prev) => {
          return {
            ...prev,
            posts: prev.posts.map((post) => {
              if (post._id.toString() === postId) {
                return {
                  ...post,
                  isShared: !isShared,
                  shareData: {
                    ...post.shareData,
                    count: post.shareData.count + (isShared ? -1 : 1),
                  },
                };
              }

              return post;
            }),
          };
        });
      }
      if (mode === "single") {
        updateQuery?.((prev: any) => {
          return {
            getSinglePost: {
              ...prev.getSinglePost,
              isShared: !!prev.getSinglePost.isShared,
            },
          };
        });
      }

      toast.success(
        data?.toggleSharedPost?.message || "operations done successfully"
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't handle your request at the momment",
        {
          duration: 7000,
        }
      );
    },
  });

  const btnContent = isShared ? "Unshare" : "Share";

  return (
    <Button
      disabled={loading}
      variant={btnVariant}
      className={`${
        btnVariant === "ghost" ? "hover:text-primary" : "hover:text-white"
      } font-semibold`}
      onClick={() => sharePost()}
    >
      <FaShare
        size={20}
        className={`fill-${btnVariant === "ghost" ? "primary" : "white"}`}
      />
      {loading ? "Loading..." : btnContent}
    </Button>
  );
};
export default SharePostBtn;
