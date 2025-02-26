// nextjs
import Image from "next/image";
import Link from "next/link";

// react
import { useContext, useEffect, useRef, useState } from "react";

// context
import { authContext } from "@/contexts/AuthContext";

// components
import CommentForm from "./CommentForm";
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";
import DeleteCommentDialog from "./DeleteCommentDialog";
import ImageWithLoading from "@/components/ImageWithLoading";
import ToggleReactionBtn from "../reactions/ToggleReactionBtn";
import ReactionsDialog from "../reactions/ReactionsDialog";

// shadcn
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// gql
import { gql, useLazyQuery } from "@apollo/client";

// SVGs
import _404SVG from "/public/illustrations/error-laptop.svg";
import commentsSVG from "/public/illustrations/comments.svg";

// types
import type { CommentType } from "@/lib/types";

// icons
import { FaPen, FaTrash, FaUser } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { FaArrowRotateLeft } from "react-icons/fa6";

// utils
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { toast } from "sonner";
import classNames from "classnames";

type Props = {
  postId: string;
  blockComments: boolean;
};

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

const GET_POST_COMMENTS = gql`
  query GetPostComments($commentData: GetPostCommentsData!) {
    getPostComments(commentData: $commentData) {
      isFinalPage
      comments {
        _id
        comment
        createdAt

        media {
          public_id
          secure_url
        }

        owner {
          _id
          username
          profilePicture {
            secure_url
            public_id
          }
        }

        reactions {
          angry {
            count
          }
          like {
            count
          }
          love {
            count
          }
          sad {
            count
          }
        }
      }
    }
  }
`;

const CommentsDialog = ({ postId, blockComments }: Props) => {
  const { user } = useContext(authContext);

  const [mode, setMode] = useState<"new" | "edit">("new");
  const [selectedCommentToEdit, setSelectedCommentToEdit] = useState<Pick<
    CommentType,
    "_id" | "comment" | "media"
  > | null>(null);
  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const [stopFetchMore, setStopFetchMore] = useState(false);
  const [skipQueryFetch, setSkipQueryFetch] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isFinalPage, setIsFinalPage] = useState(false);

  const skipCount = useRef(0);
  const pageAndLimit = useRef({
    page: 1,
    limit: 2,
  });
  const waitToFetchMore = useRef(false);

  const queryVariables = () => ({
    commentData: {
      postId,
      ...pageAndLimit.current,
      skip: skipCount.current,
    },
  });

  const [getComments, { loading, error, fetchMore }] = useLazyQuery(
    GET_POST_COMMENTS,
    {
      variables: queryVariables(),
      onCompleted(data) {
        if (!skipQueryFetch) {
          setSkipQueryFetch(true);
          setComments(data?.getPostComments?.comments || ([] as CommentType[]));
          setIsFinalPage(!!data?.getPostComments?.isFinalPage);
        }
      },
    }
  );

  const commentFromProps =
    mode === "new"
      ? {
          mode,
          postId,
          skipCount,
          setStopFetchMore,
          fetchMoreLoading,
        }
      : {
          mode,
          selectedCommentToEdit: selectedCommentToEdit!,
          setMode,
          setSelectedCommentToEdit,
        };

  const handleFetchMore = async () => {
    if (stopFetchMore) waitToFetchMore.current = true;

    if (fetchMoreLoading || loading || isFinalPage || stopFetchMore || error)
      return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    try {
      const { data } = await fetchMore({ variables: queryVariables() });

      if (data) {
        setComments((prev) => [
          ...prev,
          ...(data?.getPostComments?.comments || ([] as CommentType[])),
        ]);
        setIsFinalPage(!!data?.getPostComments?.isFinalPage);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      toast.error("can't get more comments at the momment");
    } finally {
      setFetchMoreLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchMoreLoading && waitToFetchMore.current && !stopFetchMore) {
      handleFetchMore();
      waitToFetchMore.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMoreLoading, stopFetchMore]);

  useEffect(() => {
    if (!skipQueryFetch) getComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContent
      className="overflow-auto p-0"
      aria-describedby="comments-dialog"
      onScroll={(e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        const isBottom = scrollTop + clientHeight >= scrollHeight;

        if (isBottom) handleFetchMore();
      }}
    >
      <DialogHeader className="p-5">
        <DialogTitle className="text-secondary underline mb-3">
          Post Comments
        </DialogTitle>

        <VisuallyHidden>
          <DialogDescription>post comments list</DialogDescription>
        </VisuallyHidden>

        {loading && !fetchMoreLoading && <Loading />}

        {!loading && error && !comments.length && (
          <IllustrationPage
            content="can't get this post comments at the momment"
            svg={_404SVG}
            btn={{
              type: "custom",
              component: (
                <Button
                  title="refresh the page"
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

        {!loading && !error && !comments.length && (
          <IllustrationPage
            svg={commentsSVG}
            btn={{ type: "custom", component: <></> }}
            content={
              <>
                This post doesn{"'"}t have any comments yet, <br />
                You can be the first.
              </>
            }
          />
        )}

        {/* render comments list */}
        {!!comments.length && (
          <ul className="space-y-1.5">
            {comments.map(
              ({
                _id,
                owner: { _id: ownerId, username, profilePicture },
                comment,
                media,
                createdAt,
                reactions,
              }) => (
                <li key={_id} className="flex items-start gap-1.5 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    <Link href={`/user/${ownerId}`} className="peer h-fit">
                      {profilePicture?.secure_url ? (
                        <Image
                          src={profilePicture.secure_url}
                          alt="comment owner profile picture"
                          width={55}
                          height={55}
                          className="aspect-[1] rounded-full"
                        />
                      ) : (
                        <div className="bg-primary w-[55px] h-[55px] rounded-full grid place-content-center">
                          <FaUser size={25} fill="white" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <div className="peer-hover:[&_a]:underline bg-primary bg-opacity-20 rounded-sm p-2 text-left">
                        <Link
                          href={`/user/${ownerId}`}
                          className="font-bold hover:underline"
                        >
                          {username}
                        </Link>

                        {comment && <p className="mb-2">{comment}</p>}

                        {!!media?.length && (
                          <Dialog>
                            <DialogTrigger className="w-full">
                              <ul className="flex flex-wrap gap-1.5 [&>*]:flex-1">
                                {(media || [])
                                  .slice(0, 3)
                                  .map(
                                    ({ secure_url, public_id }, mediaIndex) => {
                                      const isMoreThanThreeElements =
                                        (media || []).length > 3;

                                      return (
                                        <li
                                          key={public_id}
                                          className={classNames(
                                            "grid place-content-center min-w-[150px]",
                                            mediaIndex === 2 &&
                                              isMoreThanThreeElements
                                              ? "relative post-media-list-item-cover"
                                              : ""
                                          )}
                                        >
                                          <Image
                                            src={secure_url}
                                            alt={`media No.${
                                              mediaIndex + 1
                                            } of post`}
                                            width={250}
                                            height={250}
                                            className="aspect-[1] object-contain"
                                            priority
                                          />
                                        </li>
                                      );
                                    }
                                  )}
                              </ul>
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <VisuallyHidden>
                                  <DialogTitle>
                                    post media list dialog
                                  </DialogTitle>
                                  <DialogDescription>
                                    This is post meida list dialog
                                  </DialogDescription>
                                </VisuallyHidden>

                                <Carousel className="h-full flex gap-3">
                                  <CarouselPrevious className="self-center !static" />

                                  <CarouselContent className="h-full">
                                    {(media || []).map(
                                      (
                                        { secure_url, public_id },
                                        mediaIndex
                                      ) => {
                                        return (
                                          <CarouselItem
                                            key={public_id}
                                            className="relative h-full"
                                          >
                                            <ImageWithLoading
                                              src={secure_url}
                                              alt={`media No.${
                                                mediaIndex + 1
                                              } of post`}
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

                        <div className="w-fit ml-auto">
                          <ReactionsDialog
                            type="comment"
                            itemId={_id}
                            reactionsCount={reactions}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extralight text-gray-500 text-xs">
                          {timeAgo.format(+createdAt)}
                        </p>

                        <ToggleReactionBtn itemId={_id} type="comment" />
                      </div>
                    </div>
                  </div>

                  {ownerId.toString() === user?._id.toString() && (
                    <AlertDialog>
                      <DropdownMenu modal={false}>
                        <Button asChild>
                          <DropdownMenuTrigger title="see comment option">
                            <BsThreeDots />
                          </DropdownMenuTrigger>
                        </Button>

                        <DropdownMenuContent
                          className="space-y-0.5"
                          style={{ pointerEvents: "all" }}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();

                              setMode("edit");
                              setSelectedCommentToEdit({
                                _id,
                                comment,
                                media,
                              });
                            }}
                            className="cursor-pointer flex flex-wrap gap-1.5 items-center hover:!text-green-600 text-green-600 hover:bg-green-600 hover:bg-opacity-20 transition duration-200"
                          >
                            <FaPen />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem className="p-0">
                            <AlertDialogTrigger className="flex flex-wrap gap-1.5 items-center text-left cursor-pointer w-full text-red-600 px-2 py-1.5 hover:bg-red-600 hover:bg-opacity-20 transition duration-200">
                              <FaTrash />
                              Delete
                            </AlertDialogTrigger>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DeleteCommentDialog
                        commentId={_id}
                        skipCount={skipCount}
                        fetchMoreLoading={fetchMoreLoading}
                        setStopFetchMore={setStopFetchMore}
                        setComments={setComments}
                      />
                    </AlertDialog>
                  )}
                </li>
              )
            )}
          </ul>
        )}

        {(fetchMoreLoading || (stopFetchMore && waitToFetchMore.current)) && (
          <Loading size={16} withText withFullHeight={false} />
        )}

        {!isFinalPage && !!comments.length && !loading && (
          <Button
            disabled={loading || fetchMoreLoading}
            onClick={handleFetchMore}
            className="w-fit mx-auto"
            title="get more comments"
          >
            See More
          </Button>
        )}
      </DialogHeader>

      {!blockComments && (
        <CommentForm {...commentFromProps} setComments={setComments} />
      )}
    </DialogContent>
  );
};
export default CommentsDialog;
