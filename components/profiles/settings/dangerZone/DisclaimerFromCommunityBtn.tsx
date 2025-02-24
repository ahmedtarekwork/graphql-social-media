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
  profileType: "group" | "page";
};

const DisclaimerFromCommunityBtn = ({
  isUserAdminUpdateQuery,
  profileType,
}: Props) => {
  const params = useParams();
  const queryName = `toggle${profileType[0].toUpperCase()}${profileType.slice(
    1
  )}Admin`;

  const DISCLAIMER_FROM_COMMUNITY = gql`
   mutation RemoveAdminFrom${profileType[0].toUpperCase()}${profileType.slice(
    1
  )}($toggleAdminData: ${
    profileType === "page" ? "PageAdminInput" : "ToggleGroupAdminInput"
  }!) {
      ${queryName}(toggleAdminData: $toggleAdminData) {
        message
      }
    }
  `;

  const { user } = useContext(authContext);

  const [disclaimerFromCommunity, { loading }] = useMutation(
    DISCLAIMER_FROM_COMMUNITY,
    {
      variables: {
        toggleAdminData: {
          newAdminId: user!._id || "",
          [`${profileType}Id`]: params?.[`${profileType}Id`] || "",
          toggle: "remove",
        },
      },
      onCompleted(data) {
        isUserAdminUpdateQuery((prev) => {
          const isUserAdminQueryName = `isUserAdminIn${profileType[0].toUpperCase()}${profileType.slice(
            1
          )}`;

          return {
            ...prev!,
            [isUserAdminQueryName]: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev as any)?.[isUserAdminQueryName],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              [isUserAdminQueryName]: !(prev as any)?.[isUserAdminQueryName]?.[
                isUserAdminQueryName
              ],
            },
          };
        });

        toast.success(
          data?.[queryName]?.message ||
            `you disclaimer from ${profileType} successfully`
        );
      },
      onError({ graphQLErrors }) {
        toast.error(
          graphQLErrors?.[0]?.message ||
            "can't disclaimer from page at the momment"
        );
      },
    }
  );

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
            this {profileType} admins list, {profileType} owner can add you at
            any time if he want.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="red-btn"
            disabled={loading}
            onClick={() => disclaimerFromCommunity()}
          >
            Disclaimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default DisclaimerFromCommunityBtn;
