// react
import { useContext } from "react";

// contexts
import { PostsContext } from "@/contexts/PostsContext";

// components
// shadcn
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";

// icons
import { FaBookmark } from "react-icons/fa";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

// types
import { type InsideProfileType } from "./PostCard";
import type { PostType } from "@/lib/types";

type Props = {
  postId: string;
  isInBookMark: boolean;
  fetchMethodName: string;
} & Pick<InsideProfileType, "mode" | "updateQuery">;

const SAVE_POST = gql`
  mutation TogglePostFromBookmark($postId: ID!) {
    togglePostFromBookmark(postId: $postId) {
      message
    }
  }
`;

const SavePostBtn = ({
  postId,
  isInBookMark,
  mode,
  updateQuery,
  fetchMethodName,
}: Props) => {
  const { setData } = useContext(PostsContext);

  const [savePost, { loading }] = useMutation(SAVE_POST, {
    variables: { postId },
    onCompleted(data) {
      switch (mode) {
        case "singlePageInfoPage":
        case "profilePage": {
          setData((prev) => {
            return {
              ...prev,
              posts: prev.posts.map((post) => {
                if (post._id === postId) {
                  return {
                    ...post,
                    isInBookMark: !isInBookMark,
                  };
                }

                return post;
              }),
            };
          });
        }

        case "homePage": {
          updateQuery?.((prev) => {
            return {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev as any),

              [fetchMethodName]: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(prev as any)?.[fetchMethodName],
                posts:
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ((prev as any)?.[fetchMethodName]?.posts || []).posts.map(
                    (post: PostType) => {
                      if (post._id === postId) {
                        return {
                          ...post,
                          isInBookMark: !isInBookMark,
                        };
                      }

                      return post;
                    }
                  ),
              },
            };
          });
        }

        case "single": {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          updateQuery?.((prev: any) => {
            return {
              [fetchMethodName]: {
                ...prev[fetchMethodName],
                isInBookMark: !isInBookMark,
              },
            };
          });
        }
      }

      toast.success(
        data?.togglePostFromBookmark?.message ||
          "you request done successfully",
        { duration: 6000 }
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0].message || "can't do this operation at the momment",
        { duration: 6000 }
      );
    },
  });

  const saveBtnContent = isInBookMark ? "Unsave" : "Save";

  return (
    <DropdownMenuItem
      className="cursor-pointer text-sm hover:!text-primary !text-primary hover:!bg-primary hover:!bg-opacity-20 flex flex-wrap gap-1.5 items-center outline-none px-2 py-1.5 rounded-sm transition duration-200 save-post-to-bookmarks-btn"
      onClick={(e) => {
        const isDisabled = Object.keys(e.currentTarget.dataset).includes(
          "disabled"
        );

        if (!isDisabled) savePost();
      }}
      disabled={loading}
    >
      <FaBookmark />
      {loading ? "Saving..." : saveBtnContent}
    </DropdownMenuItem>
  );
};
export default SavePostBtn;
