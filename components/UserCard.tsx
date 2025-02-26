// nextjs
import Image from "next/image";
import Link from "next/link";

// components
// shadcn
import { Button } from "./ui/button";

// icons
import { FaEye, FaUser } from "react-icons/fa";

// types
import type { NotFullUserType } from "@/lib/types";

type BtnsType =
  | {
      btnType: "VIEW_PROFILE";
      CustomCardBtn?: never;
    }
  | {
      btnType: "CUSTOM";
      customCardBtn: ({ btnStyle }: { btnStyle: string }) => JSX.Element;
    };

type Props = {
  user: NotFullUserType;
  cardMode: "ROW" | "COLUMN";
} & BtnsType;

const UserCard = (props: Props) => {
  const {
    user: { _id, username, profilePicture },
    btnType,
    cardMode,
  } = props;

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
    <li className={styles.li}>
      <Link href={`/user/${_id}`}>
        {profilePicture?.secure_url ? (
          <Image
            src={profilePicture.secure_url}
            alt="user profile picture"
            width={cardMode === "ROW" ? 90 : 150}
            height={cardMode === "ROW" ? 90 : 150}
            priority
            className="w-full aspect-[1] object-cover"
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

      {btnType === "VIEW_PROFILE" && (
        <Button asChild className={styles.button}>
          <Link title="view this user profile" href={`/user/${_id}`}>
            <FaEye />
            View Profile
          </Link>
        </Button>
      )}

      {btnType === "CUSTOM" && <props.customCardBtn btnStyle={styles.button} />}
    </li>
  );
};
export default UserCard;
