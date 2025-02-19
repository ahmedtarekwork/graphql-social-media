// nextjs
import { useRouter } from "next/navigation";

// react
import { useContext, useEffect, useRef } from "react";

// contexts
import { PostsContext } from "@/contexts/PostsContext";

// components
// shadcn
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

// types
import { type InsideProfileType } from "./PostCard";

type Props = {
  postId: string;
  mode: Exclude<InsideProfileType["mode"], "homePage">;
} & Omit<InsideProfileType, "updateQuery" | "mode">;

const DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId) {
      message
    }
  }
`;

const DeletePostDialog = (props: Props) => {
  const { postId, mode } = props;
  const router = useRouter();
  const { setData } = useContext(PostsContext);

  const isDeletePost = useRef<boolean>(false);

  const [deletePost, { loading }] = useMutation(DELETE_POST, {
    variables: { postId },
    onCompleted() {
      if (mode === "single") {
        return router.push("/");
      }

      if (mode === "profilePage") {
        setData((prev) => {
          return {
            ...prev,
            posts: prev.posts.filter(({ _id }) => _id !== postId),
          };
        });

        if (props.skipCount) props.skipCount.current -= 1;
        if (props.setStopFetchMore) props.setStopFetchMore(false);
      }

      toast.success("post deleted successfully", { duration: 7500 });
    },

    onError({ graphQLErrors }) {
      if (props.setStopFetchMore) props.setStopFetchMore(false);

      toast.error(
        graphQLErrors?.[0]?.message || "can't delete this post at the momment",
        {
          duration: 7500,
        }
      );
    },
  });

  useEffect(() => {
    if (
      mode === "profilePage" &&
      !props.fetchMoreLoading &&
      isDeletePost.current
    ) {
      if (props.setStopFetchMore) props.setStopFetchMore(true);
      deletePost();
      isDeletePost.current = false;
    }
  }, [props?.fetchMoreLoading]);

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Are you sure about delete this post ?
        </AlertDialogTitle>

        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete this post
          for ever
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>{loading ? "Close" : "Cancel"}</AlertDialogCancel>

        <AlertDialogAction
          disabled={loading}
          className="red-btn"
          onClick={() => {
            if (mode === "profilePage") {
              if ("fetchMoreLoading" in props && !props.fetchMoreLoading) {
                if (props.setStopFetchMore) props.setStopFetchMore(true);
                deletePost();
              }
            } else deletePost();
          }}
        >
          {loading ? "Deleting..." : "Delete Post"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeletePostDialog;
