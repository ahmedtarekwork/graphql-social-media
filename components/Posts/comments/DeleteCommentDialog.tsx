// react
import {
  useEffect,
  useRef,

  // types
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

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
import type { CommentType } from "@/lib/types";

type Props = {
  commentId: string;
  skipCount: MutableRefObject<number>;
  fetchMoreLoading: boolean;
  setStopFetchMore: Dispatch<SetStateAction<boolean>>;
  setComments: Dispatch<SetStateAction<CommentType[]>>;
};

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId) {
      message
    }
  }
`;

const DeleteCommentDialog = ({
  commentId,
  skipCount,
  fetchMoreLoading,
  setStopFetchMore,
  setComments,
}: Props) => {
  const isDeletePost = useRef<boolean>(false);

  const [deleteComment, { loading }] = useMutation(DELETE_COMMENT, {
    variables: { commentId },
    onCompleted() {
      setComments((prev) =>
        prev.filter(
          ({ _id }: CommentType) => _id.toString() !== commentId.toString()
        )
      );

      skipCount.current -= 1;
      setStopFetchMore(false);

      toast.success("comment deleted successfully", { duration: 7500 });
    },

    onError(error) {
      console.log("error", error);

      setStopFetchMore(false);
      toast.error("can't delete this comment at the momment", {
        duration: 7500,
      });
    },
  });

  useEffect(() => {
    if (!fetchMoreLoading && isDeletePost.current) {
      if (setStopFetchMore) setStopFetchMore(true);
      deleteComment();
      isDeletePost.current = false;
    }
  }, [fetchMoreLoading]);

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
        <AlertDialogCancel>Cancel</AlertDialogCancel>

        <AlertDialogAction
          disabled={loading}
          className="red-btn"
          onClick={() => {
            if (!fetchMoreLoading) {
              setStopFetchMore(true);
              deleteComment();
            }
          }}
        >
          {loading ? "Deleting..." : "Delete Post"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeleteCommentDialog;
