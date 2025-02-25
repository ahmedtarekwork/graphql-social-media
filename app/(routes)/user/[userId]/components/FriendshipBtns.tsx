// react
import { useContext, useEffect, useState } from "react";

// contexts
import { userNotificationsCountContext } from "@/contexts/UserNotificationsCountContext";

// components
import Loading from "@/components/Loading";

// shadcn
import { Button } from "@/components/ui/button";

// gql
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// icons
import { FaCheckCircle } from "react-icons/fa";
import { MdBlock } from "react-icons/md";
import { PiUserMinusFill } from "react-icons/pi";

// utils
import { toast } from "sonner";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

type Props = {
  userId: string;
};

// gql
const SEND_FRIEND_SHIP_REQUEST = gql`
  mutation SendFriendshipRequest($userId: ID!) {
    sendFriendshipRequest(userId: $userId) {
      message
    }
  }
`;

const DOES_CURRENT_USER_SENT_FRIENDSHIP_REQUEST = gql`
  query DoesCurrentUserSentFriendshipRequest($receverId: ID!) {
    doesCurrentUserSentFriendshipRequest(receverId: $receverId) {
      status
    }
  }
`;
const DOES_CURRENT_USER_RECEVED_FRIENDSHIP_REQUEST = gql`
  query DoesCurrentUserRecevedFriendshipRequest($senderId: ID!) {
    doesCurrentUserRecevedFriendshipRequest(senderId: $senderId) {
      status
    }
  }
`;

const IS_PROFILE_OWNER_MY_FRIEND = gql`
  query IsUserMyFriend($userId: ID!) {
    isUserMyFriend(userId: $userId) {
      status
    }
  }
`;

const HANDLE_FRIENDSHIP_REQUEST = gql`
  mutation HandleFriendShipRequest(
    $handleFriendshipRequestData: HandleFriendShipRequestInput!
  ) {
    handleFriendShipRequest(
      handleFriendshipRequestData: $handleFriendshipRequestData
    ) {
      id
    }
  }
`;

const REMOVE_PROFILE_OWNER_FROM_FRIENDS_LIST = gql`
  mutation RemoveUserFromFriendsList($userId: ID!) {
    removeUserFromFriendsList(userId: $userId) {
      message
    }
  }
`;

const FriendshipBtns = ({ userId }: Props) => {
  const { refreshCount } = useContext(userNotificationsCountContext);

  const isCurrentUserProfile = useIsCurrentUserProfile();

  // gql
  const [sendFriendshipRequest, { loading: sendFriendshipRequestLoading }] =
    useMutation(SEND_FRIEND_SHIP_REQUEST, {
      async onCompleted(data) {
        let message = "friendship request sent successfully";

        if (data.sendFriendshipRequest.message) {
          message = data.sendFriendshipRequest.message;
        }
        toast.success(message, { duration: 8000 });

        setMainLoadingState(true);
        try {
          const { data } = await refetchIsCurrentUserSentFriendshipRequest({
            variables: { receverId: userId },
          });

          if (data?.doesCurrentUserSentFriendshipRequest) {
            setIsCurrentUserSentFriendshipRequest(
              data.doesCurrentUserSentFriendshipRequest.status
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          toast.error(
            "can't send friendship request to this user at the momment",
            { duration: 8000 }
          );
        } finally {
          setMainLoadingState(false);
        }
      },
      onError({ graphQLErrors }) {
        let message = graphQLErrors[0].message;
        if (!message) {
          message = "can't send friendship request at the momment";
        }
        toast.error(message, { duration: 6000 });
      },
    });

  const [handleFriendshipRequest, { loading: handleFriendshipRequestLoading }] =
    useMutation(HANDLE_FRIENDSHIP_REQUEST, {
      async onCompleted() {
        refreshCount("friendshipRequests");

        setMainLoadingState(true);
        try {
          const { data } = await refetchIsProfileOwnerMyFriend({
            variables: { userId },
          });
          const { data: revceveFriendshipRequestData } =
            await refetchIsCurrentUserRecevedFriendshipRequest({
              variables: { senderId: userId },
            });

          if (data?.isUserMyFriend) {
            setIsProfileOwnerMyFriend(data.isUserMyFriend.status);
          }

          if (
            revceveFriendshipRequestData?.doesCurrentUserRecevedFriendshipRequest
          ) {
            setIsCurrentUserRecevedFriendshipRequest(
              !!revceveFriendshipRequestData
                .doesCurrentUserRecevedFriendshipRequest.status
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          toast.error("can't handle friendship request at the momment", {
            duration: 7500,
          });
        } finally {
          setMainLoadingState(false);
        }
      },
      onError({ graphQLErrors }) {
        toast.error(
          graphQLErrors?.[0]?.message ||
            "can't handle this friendship request at the momment",
          { duration: 7500 }
        );
      },
    });

  const [
    removeProfileOwnerFromFriendsList,
    { loading: removeProfileOwnerFromFriendsListLoading },
  ] = useMutation(REMOVE_PROFILE_OWNER_FROM_FRIENDS_LIST, {
    async onCompleted(data) {
      setMainLoadingState(true);
      try {
        const { data } = await refetchIsProfileOwnerMyFriend({
          variables: { userId },
        });
        if (data?.isUserMyFriend) {
          setIsProfileOwnerMyFriend(data.isUserMyFriend.status);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        toast.error(
          "can't remove this user from your friends list at the momment",
          { duration: 7500 }
        );
      } finally {
        setMainLoadingState(false);
      }

      toast.success(
        data?.removeUserFromFriendsList?.message ||
          "user removed successfully from your friends list",
        { duration: 8000 }
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0].message ||
          "can't remove this user from your friends list at the momment",
        { duration: 7500 }
      );
    },
  });

  const [
    isUserMyFriendMethod,
    {
      data: isUserMyFriendResponse,
      refetch: refetchIsProfileOwnerMyFriend,
      loading: isProfileOwnerMyFriendLoading,
    },
  ] = useLazyQuery(IS_PROFILE_OWNER_MY_FRIEND, {
    onCompleted(data) {
      if (data?.isUserMyFriend) {
        setIsProfileOwnerMyFriend(data.isUserMyFriend?.status);
      }
    },
  });

  const [
    doesCurrentUserSentRequest,
    {
      data: isCurrentUserSentRequest,
      refetch: refetchIsCurrentUserSentFriendshipRequest,
      loading: isCurrentUserSentFriendshipRequestLoading,
    },
  ] = useLazyQuery(DOES_CURRENT_USER_SENT_FRIENDSHIP_REQUEST, {
    onCompleted(data) {
      if (data?.doesCurrentUserSentFriendshipRequest) {
        setIsCurrentUserSentFriendshipRequest(
          data.doesCurrentUserSentFriendshipRequest?.status
        );
      }
    },
  });

  const [
    doesCurrentUserRecevedFriendshipRequest,
    {
      data: isCurrentUserRecevedRequest,
      refetch: refetchIsCurrentUserRecevedFriendshipRequest,
      loading: isCurrentUserRecevedFriendshipRequestLoading,
    },
  ] = useLazyQuery(DOES_CURRENT_USER_RECEVED_FRIENDSHIP_REQUEST, {
    onCompleted(data) {
      if (data?.doesCurrentUserRecevedFriendshipRequest) {
        setIsCurrentUserRecevedFriendshipRequest(
          !!data.doesCurrentUserRecevedFriendshipRequest.status
        );
      }
    },
  });

  // states
  const [mainLoadingState, setMainLoadingState] = useState(false);

  const [
    isCurrentUserSentFriendshipRequest,
    setIsCurrentUserSentFriendshipRequest,
  ] = useState(
    isCurrentUserSentRequest?.doesCurrentUserSentFriendshipRequest?.status
  );

  const [isProfileOwnerMyFriend, setIsProfileOwnerMyFriend] = useState(
    isUserMyFriendResponse?.isUserMyFriend?.status
  );

  const [
    isCurrentUserRecevedFriendshipRequest,
    setIsCurrentUserRecevedFriendshipRequest,
  ] = useState(
    isCurrentUserRecevedRequest?.doesCurrentUserRecevedFriendshipRequest?.status
  );

  const initLoading =
    isCurrentUserRecevedFriendshipRequestLoading ||
    isProfileOwnerMyFriendLoading ||
    isCurrentUserSentFriendshipRequestLoading;

  useEffect(() => {
    if (!isCurrentUserProfile && userId) {
      doesCurrentUserSentRequest({
        variables: {
          receverId: userId,
        },
      });
      doesCurrentUserRecevedFriendshipRequest({
        variables: { senderId: userId },
      });
      isUserMyFriendMethod({ variables: { userId } });
    }
  }, [
    userId,
    isCurrentUserProfile,
    doesCurrentUserRecevedFriendshipRequest,
    doesCurrentUserSentRequest,
    isUserMyFriendMethod,
  ]);

  if (isCurrentUserProfile) return;

  if (initLoading) {
    return (
      <Button disabled>
        <Loading withText size={18} fill="white" />
      </Button>
    );
  }

  // if i sent friendship request to profile owner => render message to tell me that
  if (isCurrentUserSentFriendshipRequest) {
    return (
      <div className="bg-primary bg-opacity-30 rounded-md flex gap-2 items-center justify-center p-2">
        <FaCheckCircle fill="#8B08B7" />
        friendship request sent
      </div>
    );
  }

  // if profile owner sent to me friendship request => render two btns to handle request "accept" or "cancel"
  if (
    isCurrentUserRecevedFriendshipRequest &&
    !isCurrentUserSentFriendshipRequest
  ) {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          disabled={handleFriendshipRequestLoading || mainLoadingState}
          onClick={() => {
            handleFriendshipRequest({
              variables: {
                handleFriendshipRequestData: {
                  userId,
                  acception: true,
                },
              },
            });
          }}
        >
          <FaCheckCircle />
          Accept Friendship
        </Button>

        <Button
          disabled={handleFriendshipRequestLoading || mainLoadingState}
          onClick={() => {
            handleFriendshipRequest({
              variables: {
                handleFriendshipRequestData: {
                  userId,
                  acception: false,
                },
              },
            });
          }}
          className="red-btn"
        >
          <MdBlock />
          Cancel Friendship
        </Button>
      </div>
    );
  }

  // if profile owner my friend => render btn to remove him from my friends list
  if (
    !isCurrentUserRecevedFriendshipRequest &&
    !isCurrentUserSentFriendshipRequest &&
    isProfileOwnerMyFriend
  ) {
    return (
      <Button
        className="red-btn"
        onClick={() => {
          removeProfileOwnerFromFriendsList({
            variables: { userId },
          });
        }}
        disabled={removeProfileOwnerFromFriendsListLoading || mainLoadingState}
      >
        <PiUserMinusFill size={20} />
        <p>Unfriend</p>
      </Button>
    );
  }

  if (
    !isCurrentUserRecevedFriendshipRequest &&
    !isCurrentUserSentFriendshipRequest &&
    !isProfileOwnerMyFriend
  ) {
    return (
      <Button
        disabled={sendFriendshipRequestLoading || mainLoadingState}
        onClick={() => {
          if (!userId) {
            return toast.error("this user id not found", {
              duration: 5500,
            });
          }

          sendFriendshipRequest({
            variables: {
              userId,
            },
          });
        }}
      >
        <b className="text-xl">+</b>{" "}
        {sendFriendshipRequestLoading || mainLoadingState
          ? "Loading..."
          : "Add Friend"}
      </Button>
    );
  }
};
export default FriendshipBtns;
