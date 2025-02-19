// nextjs
import { useParams } from "next/navigation";

// react
import { useContext } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import Loading from "@/components/Loading";

// shadcn
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
import { Button } from "@/components/ui/button";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

// types
import type { ReturnTypeOfUseQuery } from "@/lib/types";

type Props = {
  isUserAdminUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
};

const DISCLAIMER_FROM_PAGE = gql`
  mutation DisclaimerFromPage($toggleAdminData: PageAdminInput!) {
    togglePageAdmin(toggleAdminData: $toggleAdminData) {
      message
    }
  }
`;

const DisclaimerFromPageBtn = ({ isUserAdminUpdateQuery }: Props) => {
  const pageId = (useParams()?.pageId || "") as string;

  const { user } = useContext(authContext);

  const [disclaimerFromPage, { loading }] = useMutation(DISCLAIMER_FROM_PAGE, {
    variables: {
      toggleAdminData: {
        newAdminId: user!._id || "",
        pageId,
        toggle: "remove",
      },
    },
    onCompleted(data) {
      isUserAdminUpdateQuery((prev) => {
        return {
          ...prev!,
          isUserAdminInPage: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(prev as any)!.isUserAdminInPage,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isUserAdminInPage: !(prev as any)!.isUserAdminInPage
              .isUserAdminInPage,
          },
        };
      });

      toast.success(
        data?.togglePageAdmin?.message ||
          "you disclaimer from page successfully"
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't disclaimer from page at the momment"
      );
    },
  });

  return (
    <AlertDialog>
      <Button asChild className="red-btn">
        <AlertDialogTrigger disabled={loading}>
          {loading ? (
            <Loading withText size={18} fill="white" text="Processing..." />
          ) : (
            "Disclaimer"
          )}
        </AlertDialogTrigger>
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove you from
            this page admins list, page owner can add you at any time if he
            want.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="red-btn"
            disabled={loading}
            onClick={() => disclaimerFromPage()}
          >
            Disclaimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default DisclaimerFromPageBtn;
