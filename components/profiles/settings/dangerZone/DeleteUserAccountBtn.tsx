// components
import Loading from "@/components/Loading";

// shadcn
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";
import useLogout from "@/hooks/useLogout";

const DELETE_ACCOUNT = gql`
  mutation DeleteCurrentUserAccount {
    deleteUser {
      message
    }
  }
`;

const DeleteUserAccount = () => {
  const { logout } = useLogout(false);

  const [deleteAccount, { loading }] = useMutation(DELETE_ACCOUNT, {
    async onCompleted(data) {
      toast.success(
        data?.deleteUser?.message || "your account deleted successfully"
      );

      logout();
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't delete your account at the momment"
      );
    },
  });

  return (
    <AlertDialog>
      <Button asChild className="red-btn">
        <AlertDialogTrigger
          title="ask for delete user account"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loading size={18} fill="white" /> Deleting...
            </>
          ) : (
            "Delete"
          )}
        </AlertDialogTrigger>
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-700">
            Are you absolutely sure you want to delete your account?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers forever.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{loading ? "Close" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            className="red-btn"
            disabled={loading}
            onClick={() => deleteAccount()}
          >
            {loading && <Loading size={18} fill="white" />}
            Delete forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default DeleteUserAccount;
