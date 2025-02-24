// components
import Loading from "../Loading";

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

// icons
import { ImExit } from "react-icons/im";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

type Props = Record<"memberId" | "groupId", string>;

const EXPULSING_MEMBER_FROM_GROUP = gql`
  mutation ExpulsingFromTheGroup(
    $expulsingFromGroupData: ExpulsingFromTheGroupInput!
  ) {
    expulsingFromTheGroup(expulsingFromGroupData: $expulsingFromGroupData) {
      message
    }
  }
`;

const ExpulsingUserDialog = ({ groupId, memberId }: Props) => {
  const [expulsing, { loading }] = useMutation(EXPULSING_MEMBER_FROM_GROUP, {
    variables: {
      expulsingFromGroupData: {
        groupId,
        memberId,
      },
    },
    onCompleted(data) {
      toast.success(
        data?.expulsingFromTheGroup?.message ||
          "member expulsed from successfully"
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't expulsing this member at the momment"
      );
    },
  });

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete this member
          from group and remove his personal activities.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{loading ? "Close" : "Cancel"}</AlertDialogCancel>
        <AlertDialogAction
          className="bg-orange-600 hover:!bg-orange-700"
          disabled={loading}
          onClick={() => expulsing()}
        >
          {loading ? <Loading fill="white" size={15} /> : <ImExit />}
          Expulsing
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};
export default ExpulsingUserDialog;
