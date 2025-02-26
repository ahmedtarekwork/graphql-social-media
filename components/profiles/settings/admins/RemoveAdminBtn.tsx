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
import type { NotFullUserType, ReturnTypeOfUseQuery } from "@/lib/types";

type Props = {
  adminsListUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
  userId: string;
  btnStyle: string;
  pageAndLimit: MutableRefObject<Record<"page" | "limit" | "skip", number>>;
  fetchMoreLoading: boolean;
  setStopFetchMore: Dispatch<SetStateAction<boolean>>;
  profileType: "page" | "group";
};

const RemoveAdminBtn = ({
  adminsListUpdateQuery,
  userId,
  btnStyle,
  pageAndLimit,
  fetchMoreLoading,
  setStopFetchMore,
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

  const isWaitForDelete = useRef(false);

  const [waitForFetchMore, setWaitForFetchMore] = useState(false);

  const [removeAdminFromCommunity, { loading }] = useMutation(
    DISCLAIMER_FROM_COMMUNITY,
    {
      variables: {
        toggleAdminData: {
          newAdminId: userId,
          [`${profileType}Id`]: params[`${profileType}Id`],
          toggle: "remove",
        },
      },

      onCompleted(data) {
        if (pageAndLimit.current) pageAndLimit.current.skip -= 1;

        adminsListUpdateQuery((prev) => {
          const getAdminsQueryName = `get${profileType[0].toUpperCase()}${profileType.slice(
            1
          )}AdminsList`;

          return {
            ...prev!,
            [getAdminsQueryName]: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev as any)?.[getAdminsQueryName],
              admins:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((prev as any)?.[getAdminsQueryName]?.admins || []).filter(
                  (admin: NotFullUserType) =>
                    admin._id.toString() !== userId.toString()
                ),
            },
          };
        });

        setStopFetchMore(false);

        toast.success(
          data?.[queryName]?.message ||
            `admin removed from ${profileType} successfully`
        );
      },
      onError({ graphQLErrors }) {
        setStopFetchMore(false);

        toast.error(
          graphQLErrors?.[0]?.message ||
            `can't disclaimer from ${profileType} at the momment`
        );
      },
    }
  );

  useEffect(() => {
    if (!fetchMoreLoading && isWaitForDelete.current) {
      removeAdminFromCommunity();
      isWaitForDelete.current = false;
      setWaitForFetchMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMoreLoading]);

  return (
    <AlertDialog>
      <Button asChild className={classNames("red-btn", btnStyle)}>
        <AlertDialogTrigger title="ask for remove admin" disabled={loading}>
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
            admin from this {profileType} admins list, you can add this admin at
            any time if you want.
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
              if (!fetchMoreLoading) removeAdminFromCommunity();
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
