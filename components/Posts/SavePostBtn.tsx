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

type Props = {
  postId: string;
  isInBookMark: boolean;
} & Pick<InsideProfileType, "mode" | "updateQuery">;

const SAVE_POST = gql`
  mutation TogglePostFromBookmark($postId: ID!) {
    togglePostFromBookmark(postId: $postId) {
      message
    }
  }
`;

const SavePostBtn = ({ postId, isInBookMark, mode, updateQuery }: Props) => {
  const { setData } = useContext(PostsContext);

  const [savePost, { loading }] = useMutation(SAVE_POST, {
    variables: { postId },
    onCompleted(data) {
      if (mode === "profilePage") {
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
      if (mode === "single") {
        updateQuery?.((prev: any) => {
          return {
            getSinglePost: {
              ...prev.getSinglePost,
              isInBookMark: !!prev.getSinglePost.isInBookMark,
            },
          };
        });
      }

      toast.success(data.togglePostFromBookmark.message, { duration: 6000 });
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
      className="cursor-pointer text-sm text-primary flex flex-wrap gap-1.5 items-center outline-none px-2 py-1.5 rounded-sm hover:bg-muted transition duration-200 save-post-to-bookmarks-btn"
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
