// nextjs
import { useParams, useRouter } from "next/navigation";

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

type Props = {
  profileType: "page" | "group";
};

const DeleteCommunityBtn = ({ profileType }: Props) => {
  const params = useParams();
  const router = useRouter();

  const DELETE_COMMUNITY = gql`
    mutation DeleteCommunity($${profileType}Id: ID!) {
        delete${profileType[0].toUpperCase()}${profileType.slice(
    1
  )}(${profileType}Id:$${profileType}Id) {
          message
        }
    }
  `;

  const [deleteGroup, { loading }] = useMutation(DELETE_COMMUNITY, {
    variables: {
      [`${profileType}Id`]: params?.[`${profileType}Id`] || "",
    },

    onCompleted(data) {
      router.push("/");

      toast.success(
        data?.[`delete${profileType[0].toUpperCase()}${profileType.slice(1)}`]
          ?.message || "group deleted successfully"
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message || "can't delete this group at the momment"
      );
    },
  });

  return (
    <AlertDialog>
      <Button asChild className="red-btn">
        <AlertDialogTrigger disabled={loading}>
          {loading ? (
            <>
              <Loading fill="white" size={18} /> Deleting
            </>
          ) : (
            "Delete"
          )}
        </AlertDialogTrigger>
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-700">
            Are you absolutely sure you want to delete this page?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this page
            and remove it{"'"}s data from our servers forever.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{loading ? "Close" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="red-btn"
            onClick={() => deleteGroup()}
          >
            {loading && <Loading fill="white" size={18} />}
            Delete forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default DeleteCommunityBtn;
