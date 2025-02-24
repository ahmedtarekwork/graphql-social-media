// nextjs
import Image from "next/image";
import Link from "next/link";

// react
import {
  useContext,

  // type
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import SavePostBtn from "./SavePostBtn";
import DeletePostDialog from "./DeletePostDialog";
import DisplayPostShares from "./postShares/DisplayPostShares";
import CommentsDialog from "./comments/CommentsDialog";
import SharePostBtn from "./postShares/SharePostBtn";
import ToggleReactionBtn from "./reactions/ToggleReactionBtn";
import ReactionsDialog from "./reactions/ReactionsDialog";
import ImageWithLoading from "../ImageWithLoading";
import ExpulsingUserDialog from "./ExpulsingUserDialog";

// shadcn
import { Button } from "../ui/button";
import { AlertDialog, AlertDialogTrigger } from "../ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// types
import type { PostType, ReturnTypeOfUseQuery } from "@/lib/types";

// icons
import {
  FaCommentAlt,
  FaFlag,
  FaLock,
  FaPen,
  FaShare,
  FaTrash,
  FaUser,
  FaUserFriends,
} from "react-icons/fa";
import { FaEarthAmericas } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import { HiMiniUserGroup } from "react-icons/hi2";
import { ImExit } from "react-icons/im";

// utils
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import classNames from "classnames";

// gql
import { useQuery } from "@apollo/client";

export type InsideProfileType =
  | {
      mode: "homePage";
      skipCount?: never;
      fetchMoreLoading?: never;
      setStopFetchMore?: never;
      normalUser?: never;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    }
  | {
      mode: "profilePage";
      skipCount: MutableRefObject<number>;
      fetchMoreLoading: boolean;
      setStopFetchMore: Dispatch<SetStateAction<boolean>>;
      updateQuery?: never;
      normalUser?: never;
    }
  | {
      mode: "singlePageInfoPage" | "singleGroupInfoPage";
      skipCount: MutableRefObject<number>;
      fetchMoreLoading: boolean;
      setStopFetchMore: Dispatch<SetStateAction<boolean>>;
      updateQuery?: never;
      normalUser: boolean;
    }
  | {
      mode: "single";
      updateQuery: ReturnType<typeof useQuery>["updateQuery"];
      skipCount?: never;
      fetchMoreLoading?: never;
      setStopFetchMore?: never;
      normalUser?: never;
    };

type Props = {
  TagName: keyof Pick<JSX.IntrinsicElements, "li" | "div">;
  post: PostType;
  fetchMethodName: string;
} & InsideProfileType;

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

const PostCard = ({
  TagName,
  post: {
    _id,
    owner: { profilePicture, username, _id: ownerId },
    shareDate,
    caption,
    media,
    isInBookMark,
    community,
    privacy,
    shareData,
    commentsCount,
    isShared,
    reactions,
    sharePerson,
    communityInfo,
    blockComments,
  },
  skipCount,
  fetchMoreLoading,
  setStopFetchMore,
  mode,
  updateQuery,
  fetchMethodName,
  normalUser,
}: Props) => {
  const { user } = useContext(authContext);

  let PrivacyIcon = FaEarthAmericas;

  switch (privacy) {
    case "friends_only": {
      PrivacyIcon = FaUserFriends;
    }
    case "only_me": {
      PrivacyIcon = FaLock;
    }
  }

  const deletePostDialogProps =
    mode === "single"
      ? { mode }
      : {
          mode: "profilePage" as const,
          skipCount,
          fetchMoreLoading,
          setStopFetchMore,
        };

  let profilePictureSrc =
    community === "page"
      ? communityInfo?.profilePicture?.secure_url
      : profilePicture?.secure_url;

  let NoOwnerPictureIcon = FaUser;

  if (community === "page") NoOwnerPictureIcon = FaFlag;

  let showPostModifyBtns = false;

  switch (mode) {
    case "homePage": {
      if (ownerId.toString() === user?._id.toString())
        showPostModifyBtns = true;

      break;
    }
    case "singlePageInfoPage": {
      if (!normalUser) showPostModifyBtns = true;

      break;
    }
    case "singleGroupInfoPage": {
      if (ownerId.toString() === user?._id.toString() || !normalUser)
        showPostModifyBtns = true;

      break;
    }
  }

  return (
    <TagName className="rounded-sm shadow-md p-2 border border-primary space-y-1.5">
      {mode === "homePage" && community === "group" ? (
        <p className="text-gray-500 pl-1.5 flex items-center gap-1.5 flex-wrap font-semibold">
          From{" "}
          <Link
            href={`/groups/${communityInfo?._id}`}
            className="flex items-center gap-2 w-fit text-black hover:underline underline-offset-[7px] font-bold"
          >
            {communityInfo?.profilePicture?.secure_url && (
              <Image
                src={communityInfo?.profilePicture?.secure_url}
                alt="group profile picture"
                width={30}
                height={30}
                className="rounded-full aspect-[1]"
              />
            )}
            {communityInfo?.name.slice(0, 25)}
            {(communityInfo?.name || "").length > 25 ? "..." : ""}
          </Link>{" "}
          Group
        </p>
      ) : null}

      {sharePerson && (
        <b className="text-gray-500  flex gap-1 flex-wrap items-center">
          <FaShare size={16} className={`fill-gray-500`} />
          <Link
            href={`/user/${sharePerson._id}`}
            className="hover:underline text-black"
          >
            {sharePerson.profilePicture?.secure_url && (
              <Image
                width={30}
                height={30}
                src={sharePerson.profilePicture?.secure_url}
                alt="post sharer image"
                className="rounded-full"
              />
            )}
            {sharePerson.username || "this user"}
          </Link>{" "}
          shared this post
        </b>
      )}

      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex gap-1">
          <Link
            href={`/${community === "personal" ? "user" : community + "s"}/${
              community === "personal" ? ownerId : communityInfo?._id || ""
            }`}
            className="peer"
          >
            {profilePictureSrc ? (
              <Image
                alt="post owner picture"
                src={profilePictureSrc}
                width={35}
                height={35}
                className="aspect-[1] rounded-full post-card-img"
              />
            ) : (
              <div className="bg-primary rounded-full w-[35px] h-[35px] grid place-content-center post-card-img">
                <NoOwnerPictureIcon size={20} fill="white" />
              </div>
            )}
          </Link>

          <div className="peer-hover:[&_a]:underline">
            <Link
              href={`/${community === "personal" ? "user" : community + "s"}/${
                community === "personal" ? ownerId : communityInfo?._id || ""
              }`}
              className="font-bold hover:underline"
            >
              {community === "page" ? communityInfo?.name : username}
            </Link>

            <div className="flex items-center gap-1 flex-wrap">
              {community === "personal" && (
                <PrivacyIcon className="fill-gray-500" size={14} />
              )}
              {community === "page" && (
                <FaFlag className="fill-gray-500" size={14} />
              )}
              {community === "group" && (
                <HiMiniUserGroup className="fill-gray-500" size={14} />
              )}

              <p className="font-extralight text-gray-500 text-xs">
                {timeAgo.format(+shareDate)}
              </p>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialog>
            <DropdownMenu modal={false}>
              <Button asChild>
                <DropdownMenuTrigger>
                  <BsThreeDots />
                </DropdownMenuTrigger>
              </Button>

              <DropdownMenuContent className="space-y-0.5">
                <SavePostBtn
                  mode={mode}
                  updateQuery={updateQuery}
                  postId={_id}
                  isInBookMark={isInBookMark}
                  fetchMethodName={fetchMethodName}
                />

                {showPostModifyBtns && (
                  <>
                    <Link href={`/editPost/${_id}`}>
                      <DropdownMenuItem className="cursor-pointer flex flex-wrap gap-1.5 items-center hover:!text-green-600 !text-green-600 hover:!bg-green-600 hover:!bg-opacity-20 transition duration-200">
                        <FaPen />
                        Edit
                      </DropdownMenuItem>
                    </Link>

                    <DropdownMenuItem className="p-0">
                      <AlertDialogTrigger className="rounded-sm flex flex-wrap gap-1.5 items-center text-left cursor-pointer w-full !text-red-600 px-2 py-1.5 hover:!bg-red-600 hover:!bg-opacity-20 transition duration-200">
                        <FaTrash />
                        Delete
                      </AlertDialogTrigger>
                    </DropdownMenuItem>
                  </>
                )}

                {community === "group" &&
                !normalUser &&
                ownerId.toString() !== user?._id.toString() ? (
                  <DropdownMenuItem className="p-0">
                    <AlertDialogTrigger
                      className={
                        "px-2 py-1.5 rounded-sm cursor-pointer flex flex-wrap gap-1.5 items-center hover:!text-orange-600 !text-orange-600 hover:!bg-orange-600 hover:!bg-opacity-20 transition duration-200"
                      }
                    >
                      <ImExit />
                      Expulsing user from group
                    </AlertDialogTrigger>{" "}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <ExpulsingUserDialog
              memberId={ownerId}
              groupId={communityInfo?._id || ""}
            />
          </AlertDialog>

          <DeletePostDialog postId={_id} {...deletePostDialogProps} />
        </AlertDialog>
      </div>

      {caption && (
        <p className="border-t border-primary pt-2 pb-1">{caption}</p>
      )}

      {!!media?.length && (
        <Dialog>
          <DialogTrigger className="w-full">
            <ul className="flex flex-wrap gap-1.5 [&>*]:flex-1">
              {(media || [])
                .slice(0, 3)
                .map(({ secure_url, public_id }, mediaIndex) => {
                  const isMoreThanThreeElements = (media || []).length > 3;

                  return (
                    <li
                      key={public_id}
                      className={classNames(
                        "grid place-content-center",
                        mediaIndex === 2 && isMoreThanThreeElements
                          ? "relative post-media-list-item-cover"
                          : ""
                      )}
                    >
                      <Image
                        src={secure_url}
                        alt={`media No.${mediaIndex + 1} of post`}
                        width={250}
                        height={250}
                        className="aspect-[1] object-contain"
                        priority
                      />
                    </li>
                  );
                })}
            </ul>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>post media list dialog</DialogTitle>
                <DialogDescription>
                  This is post meida list dialog
                </DialogDescription>
              </VisuallyHidden>

              <Carousel className="h-full flex gap-3">
                <CarouselPrevious className="self-center !static" />

                <CarouselContent className="h-full">
                  {(media || []).map(
                    ({ secure_url, public_id }, mediaIndex) => {
                      return (
                        <CarouselItem
                          key={public_id}
                          className="relative h-full"
                        >
                          <ImageWithLoading
                            src={secure_url}
                            alt={`media No.${mediaIndex + 1} of post`}
                            className="aspect-[1] object-contain"
                            fill
                            priority
                          />
                        </CarouselItem>
                      );
                    }
                  )}
                </CarouselContent>

                <CarouselNext className="self-center !static" />
              </Carousel>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}

      <Dialog>
        <div className="flex gap-3 flex-wrap items-center py-1">
          <ReactionsDialog
            type="post"
            itemId={_id}
            reactionsCount={reactions}
          />

          <DialogTrigger className="flex items-center flex-wrap pb-0.5 gap-1 text-primary transition duration-100 text-sm border-b border-b-transparent hover:border-primary">
            <FaCommentAlt size={20} className="fill-primary" />
            {commentsCount}
          </DialogTrigger>

          {community !== "group" && (
            <DisplayPostShares
              postId={_id}
              postOwnerId={ownerId}
              isShared={isShared}
              sharesCount={shareData.count}
              mode={mode}
              updateQuery={updateQuery}
              fetchMethodName={fetchMethodName}
            />
          )}
        </div>

        <div className="flex items-center flex-wrap gap-0.5 [&>*]:flex-1 border-t border-primary pt-1 text-primary">
          <ToggleReactionBtn itemId={_id} type="post" />

          <Button
            asChild
            variant="ghost"
            className="hover:text-primary font-semibold"
          >
            <DialogTrigger>
              <FaCommentAlt size={20} className="fill-primary" />
              Comment
            </DialogTrigger>
          </Button>

          {community !== "group" && user?._id !== ownerId && (
            <SharePostBtn
              mode={mode}
              updateQuery={updateQuery}
              isShared={!!isShared}
              postId={_id}
              btnVariant="ghost"
              fetchMethodName={fetchMethodName}
            />
          )}
        </div>

        <CommentsDialog blockComments={blockComments} postId={_id} />
      </Dialog>
    </TagName>
  );
};
export default PostCard;
