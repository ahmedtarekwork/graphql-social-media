// react
import {
  useContext,
  useRef,
  useState,

  // types
  type Dispatch,
  type SetStateAction,
} from "react";

// nextjs
import Link from "next/link";

// contexts
import { userNotificationsCountContext } from "@/contexts/UserNotificationsCountContext";

// components
import Loading from "./Loading";
import IllustrationPage from "./IllustrationPage";

// shadcn
import { Button } from "./ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// types
import type { NotificationType } from "@/lib/types";

// gql
import { gql, useMutation, useQuery } from "@apollo/client";

// icons
import { FaCheckCircle, FaUserFriends } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { FaArrowRotateLeft } from "react-icons/fa6";

// utils
import { toast } from "sonner";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

// SVGs
import _404 from "/public/illustrations/404.svg";

type Props = {
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
};

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

const GET_USER_NOTIFICATIONS = gql`
  query GetUserNotifications($notificationsPagination: PaginatedItemsInput!) {
    getUserNotifications(notificationsPagination: $notificationsPagination) {
      notifications {
        _id
        createdAt
        content
        url
        icon
        hasRead
      }
      isFinalPage
    }
  }
`;
const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      message
    }
  }
`;
const MARK_SINGLE_NOTIFICATIONS_AS_READ = gql`
  mutation MarkSingleNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
    }
  }
`;

const NotificationsDialogContent = ({ setOpenDialog }: Props) => {
  const { refreshCount } = useContext(userNotificationsCountContext);

  const pageAndLimit = useRef({
    page: 1,
    limit: 10,
  });
  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { loading, error, data, fetchMore, updateQuery } = useQuery(
    GET_USER_NOTIFICATIONS,
    {
      variables: { notificationsPagination: pageAndLimit.current },

      onError(error) {
        console.log(error);
      },
    }
  );

  const [
    markAllNotificationsAsRead,
    { loading: markAllNotificationsAsReadLoading },
  ] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
    onCompleted() {
      updateQuery((prev) => {
        return {
          getUserNotifications: {
            ...prev.getUserNotifications,
            notifications: (
              prev?.getUserNotifications?.notifications || []
            ).map((not: NotificationType) => ({ ...not, hasRead: true })),
          },
        };
      });

      refreshCount("notifications");

      toast.success("all notifications marked as read successfully", {
        duration: 7500,
      });
    },
    onError() {
      toast.error("something went wrong while mark all notifications as read", {
        duration: 7500,
      });
    },
  });

  const [markSingleNotificationAsRead] = useMutation(
    MARK_SINGLE_NOTIFICATIONS_AS_READ,
    {
      onCompleted(data) {
        const id = data.markNotificationAsRead.id;
        if (id) {
          updateQuery((prev) => {
            console.log(prev);

            return {
              getUserNotifications: {
                ...prev.getUserNotifications,
                notifications: (
                  prev?.getUserNotifications?.notifications || []
                ).map((not: NotificationType) => {
                  if (not._id.toString() === id) {
                    return { ...not, hasRead: true };
                  }

                  return not;
                }),
              },
            };
          });

          refreshCount("notifications");
        }
      },
    }
  );

  const notifications = (data?.getUserNotifications?.notifications ||
    []) as NotificationType[];
  const isFinalPage = data?.getUserNotifications?.isFinalPage;

  const handleFetchMore = () => {
    if (isFinalPage || loading || fetchMoreLoading || error) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: { notificationsPagination: pageAndLimit.current },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          getUserNotifications: {
            notifications: [
              ...notifications,
              ...(fetchMoreResult?.getUserNotifications?.notifications || []),
            ],
            isFinalPage: !!fetchMoreResult?.getUserNotifications?.isFinalPage,
          },
        };
      },
    });
  };

  return (
    <DialogContent
      className="overflow-auto"
      aria-describedby="notifications-dialog"
      onScroll={(e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        const isBottom = scrollTop + clientHeight >= scrollHeight;

        if (isBottom) handleFetchMore();
      }}
    >
      <DialogHeader>
        <DialogTitle className="mt-[25px] flex flex-wrap gap-2 justify-between items-center ">
          <p className="font-bold text-secondary underline leading-8">
            Your Notifications
          </p>

          <Button
            disabled={markAllNotificationsAsReadLoading}
            onClick={() => markAllNotificationsAsRead()}
          >
            {markAllNotificationsAsReadLoading
              ? "Loading..."
              : "mark all as read"}
          </Button>
        </DialogTitle>

        <DialogDescription />

        {loading && <Loading />}

        {error && !loading && (
          <IllustrationPage
            svg={_404}
            content="can't get your notifications at the momment"
            btn={{
              type: "custom",
              component: (
                <Button
                  className="mx-auto"
                  onClick={() => window.location.reload()}
                >
                  <FaArrowRotateLeft />
                  refresh page
                </Button>
              ),
            }}
          />
        )}

        {!notifications.length && !error && !loading && (
          <b>You don{"'"}t have any notifications.</b>
        )}

        {!!notifications.length && !error && !loading && (
          <>
            <ul className="space-y-1 pb-3">
              {notifications.map(
                ({ _id, content, url, icon, hasRead, createdAt }) => {
                  let Icon = MdNotificationsActive;

                  switch (icon) {
                    case "friend": {
                      Icon = FaUserFriends;
                    }
                  }

                  return (
                    <li id={_id} key={_id}>
                      <Link
                        href={url}
                        onClick={() => {
                          setOpenDialog(false);
                          if (!hasRead) {
                            markSingleNotificationAsRead({
                              variables: { id: _id },
                            });
                          }
                        }}
                        className="bg-primary bg-opacity-20 p-2 rounded-sm transition duration-200 hover:bg-opacity-40 gap-2 flex items-center justify-between flex-wrap"
                      >
                        <div className="flex gap-2 items-center justify-center flex-wrap w-fit">
                          <div className="rounded-full bg-secondary bg-opacity-90 w-[40px] h-[40px] grid place-content-center">
                            <Icon size={25} fill="white" />
                          </div>
                          <p>{content}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <p className="text-gray-600 text-sm font-light">
                            {timeAgo.format(+createdAt)}
                          </p>

                          {hasRead && (
                            <FaCheckCircle className="fill-primary" />
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                }
              )}
            </ul>

            {fetchMoreLoading && (
              <Loading size={16} withText withFullHeight={false} />
            )}

            {!isFinalPage && (
              <Button
                className="mx-auto block"
                disabled={loading || fetchMoreLoading}
                onClick={handleFetchMore}
              >
                see more
              </Button>
            )}
          </>
        )}

        {fetchMoreLoading && (
          <Loading size={16} withText withFullHeight={false} />
        )}
      </DialogHeader>
    </DialogContent>
  );
};
export default NotificationsDialogContent;
