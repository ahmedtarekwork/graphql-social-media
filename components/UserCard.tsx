// nextjs
import Image from "next/image";
import Link from "next/link";

// react
import { useContext } from "react";

// contexts
import { userNotificationsCountContext } from "@/contexts/UserNotificationsCountContext";

// components
// shadcn
import { Button } from "./ui/button";

// icons
import { MdBlock } from "react-icons/md";
import { FaCheckCircle, FaEye, FaUser } from "react-icons/fa";

// types
import type { NotFullUserType } from "@/lib/types";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

type BtnsType =
  | { btnsType: "VIEW_PROFILE" }
  | {
      btnsType: "HANDLE_FRIENDSHIP_REQUEST";
      onHandleRequestCompleted?: (userId: string) => void;
    };

type Props = {
  user: NotFullUserType;
  cardMode: "ROW" | "COLUMN";
} & BtnsType;

// gql
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

const UserCard = (props: Props) => {
  const {
    user: { _id, username, profilePicture },
    btnsType,
    cardMode,
  } = props;

  const { refreshCount } = useContext(userNotificationsCountContext);

  const [handleFriendshipRequest, { loading: handleFriendshipRequestLoading }] =
    useMutation(HANDLE_FRIENDSHIP_REQUEST, {
      onCompleted(data) {
        refreshCount("friendshipRequests");

        const userId = data?.handleFriendShipRequest?.id;

        if (props.btnsType === "HANDLE_FRIENDSHIP_REQUEST" && userId)
          props.onHandleRequestCompleted?.(userId);
      },
      onError({ graphQLErrors }) {
        toast.error(
          graphQLErrors?.[0]?.message ||
            "can't handle this friendship request at the momment",
          { duration: 7500 }
        );
      },
    });

  const styles = {
    li:
      cardMode === "ROW"
        ? "flex justify-between gap-3 flex-wrap items-center bg-primary bg-opacity-25 rounded-md p-3 max-sm:flex-col"
        : "rounded-md border-2 border-primary overflow-hidden",
    button: cardMode === "ROW" ? "max-sm:w-full" : "w-[95%] mx-auto flex mb-1",
    username:
      cardMode === "COLUMN" ? "truncate px-[5%] block my-1.5" : "sm:mr-auto",
    imagePlaceHolder:
      cardMode === "COLUMN" ? "w-full aspect-[1]" : "w-[90px] h-[90px]",
  };

  const showUserName = (username: string) => {
    if (cardMode === "ROW") {
      return `${username.slice(0, 20)}${username.length > 20 ? "..." : ""}`;
    }

    return username;
  };

  return (
    <li key={_id} className={styles.li}>
      <Link href={`/user/${_id}`}>
        {profilePicture?.secure_url ? (
          <Image
            src={profilePicture.secure_url}
            alt="user profile picture"
            width={cardMode === "ROW" ? 90 : 150}
            height={cardMode === "ROW" ? 90 : 150}
            priority
            className="w-full aspect-[1]"
          />
        ) : (
          <div
            className={`bg-secondary flex justify-center items-center ${styles.imagePlaceHolder}`}
          >
            <FaUser size={45} fill="white" />
          </div>
        )}
      </Link>

      <Link
        href={`/user/${_id}`}
        className={`font-bold block w-fit hover:underline ${styles.username}`}
      >
        {showUserName(username)}
      </Link>

      {btnsType === "HANDLE_FRIENDSHIP_REQUEST" && (
        <div className="space-y-2 p-2 [&>*]:w-full">
          <Button
            onClick={() => {
              handleFriendshipRequest({
                variables: {
                  handleFriendshipRequestData: {
                    userId: _id,
                    acception: true,
                  },
                },
              });
            }}
            disabled={handleFriendshipRequestLoading}
            className={styles.button}
          >
            <FaCheckCircle />
            Accept
          </Button>

          <Button
            onClick={() => {
              handleFriendshipRequest({
                variables: {
                  handleFriendshipRequestData: {
                    userId: _id,
                    acception: false,
                  },
                },
              });
            }}
            className={`red-btn ${styles.button}`}
            disabled={handleFriendshipRequestLoading}
          >
            <MdBlock />
            Cancel
          </Button>
        </div>
      )}

      {btnsType === "VIEW_PROFILE" && (
        <Button asChild className={styles.button}>
          <Link href={`/user/${_id}`}>
            <FaEye />
            View Profile
          </Link>
        </Button>
      )}
    </li>
  );
};
export default UserCard;
