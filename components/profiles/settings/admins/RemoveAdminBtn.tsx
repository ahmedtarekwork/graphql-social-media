// nextjs
import { useParams } from "next/navigation";

// react
import {
  useEffect,
  useRef,
  useState,

  // types
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

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
import classNames from "classnames";

// types
import type { ReturnTypeOfUseQuery, UserType } from "@/lib/types";

type Props = {
  adminsListUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
  userId: string;
  btnStyle: string;
  pageAndLimit: MutableRefObject<Record<"page" | "limit" | "skip", number>>;
  fetchMoreLoading: boolean;
  setStopFetchMore: Dispatch<SetStateAction<boolean>>;
};

const DISCLAIMER_FROM_PAGE = gql`
  mutation RemoveAdminFromPage($toggleAdminData: PageAdminInput!) {
    togglePageAdmin(toggleAdminData: $toggleAdminData) {
      message
    }
  }
`;

const RemoveAdminBtn = ({
  adminsListUpdateQuery,
  userId,
  btnStyle,
  pageAndLimit,
  fetchMoreLoading,
  setStopFetchMore,
}: Props) => {
  const pageId = (useParams()?.pageId || "") as string;

  const isWaitForDelete = useRef(false);

  const [waitForFetchMore, setWaitForFetchMore] = useState(false);

  const [removeAdminFromPage, { loading }] = useMutation(DISCLAIMER_FROM_PAGE, {
    variables: {
      toggleAdminData: {
        newAdminId: userId,
        pageId,
        toggle: "remove",
      },
    },

    onCompleted(data) {
      if (pageAndLimit.current) pageAndLimit.current.skip -= 1;

      adminsListUpdateQuery((prev) => {
        return {
          ...prev!,
          getPageAdminsList: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(prev as any)!.getPageAdminsList,
            admins:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((prev as any)!.getPageAdminsList.admins || []).filter(
                (admin: UserType) => admin._id.toString() !== userId.toString()
              ),
          },
        };
      });

      setStopFetchMore(false);

      toast.success(
        data?.togglePageAdmin?.message || "admin removed from page successfully"
      );
    },
    onError({ graphQLErrors }) {
      setStopFetchMore(false);

      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't disclaimer from page at the momment"
      );
    },
  });

  useEffect(() => {
    if (!fetchMoreLoading && isWaitForDelete.current) {
      removeAdminFromPage();
      isWaitForDelete.current = false;
      setWaitForFetchMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMoreLoading]);

  return (
    <AlertDialog>
      <Button asChild className={classNames("red-btn", btnStyle)}>
        <AlertDialogTrigger disabled={loading}>
          {loading || waitForFetchMore ? (
            <Loading withText size={18} fill="white" text="Processing..." />
          ) : (
            "Remove"
          )}
        </AlertDialogTrigger>
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove this
            admin from this page admins list, you can add this admin at any time
            if you want.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading || waitForFetchMore}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="red-btn"
            disabled={loading || waitForFetchMore}
            onClick={() => {
              if (!fetchMoreLoading) removeAdminFromPage();
              else {
                isWaitForDelete.current = true;
                setWaitForFetchMore(true);
              }
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default RemoveAdminBtn;
