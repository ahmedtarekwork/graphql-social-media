"use client";

// react
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// contexts
import { authContext } from "./AuthContext";

// apollo
import { gql, useLazyQuery } from "@apollo/client";

export const userNotificationsCountContext = createContext<
  Record<
    "notifications" | "friendshipRequests",
    {
      count: number;
      loading: boolean;
      err: boolean;
    }
  > & { refreshCount: (type: "friendshipRequests" | "notifications") => void }
>({
  notifications: { count: 0, loading: false, err: false },
  friendshipRequests: { count: 0, loading: false, err: false },
  refreshCount: () => {},
});

const GET_NOTIFICATIONS_COUNT = gql`
  query GetUserNotificationsCount {
    getUserNotificationsCount {
      count
    }
  }
`;

const GET_FRIENDSHIP_REQUESTS_COUNT = gql`
  query GetUserFriendshipRequestsCount {
    getUserFriendshipRequestsCount {
      count
    }
  }
`;

const UserNotificationsCountContext = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useContext(authContext);
  const isFetched = useRef(false);

  const [
    getUserNotificationsCount,
    {
      loading: notificationsCountLoading,
      data: notificationsCount,
      error: notificationsCountErr,
      refetch: refetchNotificationsCount,
    },
  ] = useLazyQuery(GET_NOTIFICATIONS_COUNT, {
    onCompleted(data) {
      setMainData((prev) => ({
        ...prev,
        notifications: {
          count: data?.getUserNotificationsCount?.count || 0,
          loading: false,
          err: false,
        },
      }));
    },
    onError() {
      setMainData((prev) => ({
        ...prev,
        notifications: { count: prev.notifications, loading: false, err: true },
      }));
    },
  });

  const [
    getUserFriendshipRequestsCount,
    {
      loading: friendshipRequestsCountLoading,
      data: friendshipRequestsCount,
      error: friendshipRequestsCountErr,
      refetch: refetchFriendshipRequestsCount,
    },
  ] = useLazyQuery(GET_FRIENDSHIP_REQUESTS_COUNT, {
    onCompleted(data) {
      setMainData((prev) => ({
        ...prev,
        friendshipRequests: {
          count:
            data?.getUserFriendshipRequestsCount?.count ||
            prev.friendshipRequests.count,
          loading: false,
          err: false,
        },
      }));
    },
    onError() {
      setMainData((prev) => ({
        ...prev,
        friendshipRequests: {
          count: prev.friendshipRequests,
          loading: false,
          err: true,
        },
      }));
    },
  });

  const [mainData, setMainData] = useState({
    notifications: {
      count: notificationsCount?.getUserNotificationsCount?.count || 0,
      loading: notificationsCountLoading,
      err: !!notificationsCountErr,
    },
    friendshipRequests: {
      count:
        friendshipRequestsCount?.getUserFriendshipRequestsCount?.count || 0,
      loading: friendshipRequestsCountLoading,
      err: !!friendshipRequestsCountErr,
    },
  });

  const refreshCount = async (type: "friendshipRequests" | "notifications") => {
    const method =
      type === "friendshipRequests"
        ? refetchFriendshipRequestsCount
        : refetchNotificationsCount;

    try {
      const { data } = await method();

      const newCount =
        data?.[
          `getUser${
            type === "friendshipRequests"
              ? "FriendshipRequests"
              : "Notifications"
          }Count`
        ]?.count;

      const oldCount =
        type === "friendshipRequests"
          ? friendshipRequestsCount
          : notificationsCount;

      if (!isNaN(newCount) && newCount !== oldCount) {
        setMainData((prev) => {
          return {
            ...prev,
            [type]: { ...prev[type], count: newCount },
          };
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {}
  };

  useEffect(() => {
    if (user && !isFetched.current) {
      getUserNotificationsCount();
      getUserFriendshipRequestsCount();
      isFetched.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <userNotificationsCountContext.Provider
      value={{
        ...mainData,
        refreshCount,
      }}
    >
      {children}
    </userNotificationsCountContext.Provider>
  );
};
export default UserNotificationsCountContext;
