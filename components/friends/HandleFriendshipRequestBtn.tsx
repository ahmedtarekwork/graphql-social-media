// react
import { useContext } from "react";

// contexts
import { userNotificationsCountContext } from "@/contexts/UserNotificationsCountContext";

// components
// shadcn
import { Button } from "../ui/button";

// icons
import { MdBlock } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";

// utils
import { toast } from "sonner";
import classNames from "classnames";

// gql
import { gql, useMutation } from "@apollo/client";

// types
import type { NotFullUserType, ReturnTypeOfUseQuery } from "@/lib/types";

type Props = {
  updateQuery: ReturnTypeOfUseQuery["updateQuery"];
  userId: string;
  btnStyle: string;
};

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

const HandleFriendshipRequestBtn = ({
  updateQuery,
  userId,
  btnStyle,
}: Props) => {
  const { refreshCount } = useContext(userNotificationsCountContext);

  const [handleFriendshipRequest, { loading: handleFriendshipRequestLoading }] =
    useMutation(HANDLE_FRIENDSHIP_REQUEST, {
      onCompleted(data) {
        refreshCount("friendshipRequests");

        const userId = data?.handleFriendShipRequest?.id;

        if (userId) {
          updateQuery((prev) => {
            return {
              getUserFriendsRequests: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(prev as any)!.getUserFriendsRequests,
                friendsRequests:
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (prev as any)!.getUserFriendsRequests.friendsRequests.filter(
                    (user: NotFullUserType) => user._id !== userId
                  ),
              },
            };
          });
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

  return (
    <div className="space-y-2 p-2 [&>*]:w-full">
      <Button
        title="accept friend ship request"
        className={btnStyle}
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
        disabled={handleFriendshipRequestLoading}
      >
        <FaCheckCircle />
        Accept
      </Button>

      <Button
        title="cancel friend ship request"
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
        className={classNames("red-btn", btnStyle)}
        disabled={handleFriendshipRequestLoading}
      >
        <MdBlock />
        Cancel
      </Button>
    </div>
  );
};
export default HandleFriendshipRequestBtn;
