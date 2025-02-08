import { type FormEvent } from "react";
// components
// shadcn
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

const ADD_COMMENT = gql`
  mutation AddComment {
    addComment {
      message
    }
  }
`;

const CommentForm = () => {
  const [addComment, { loading }] = useMutation(ADD_COMMENT, {
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't submit your comment at the momment",
        { duration: 7000 }
      );
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-1 items-center h-fit mt-auto"
    >
      <Input placeholder="Comment..." className="flex-1" />
      <Button disabled={loading} className="flex-[0.2]">
        Submit
      </Button>
    </form>
  );
};
export default CommentForm;
