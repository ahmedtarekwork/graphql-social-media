// nextjs
import Image from "next/image";
import Link from "next/link";

// react
import { useEffect, useRef, useState, type ReactNode } from "react";

// components
import CommentForm from "./CommentForm";
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";

// shadcn
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import _404SVG from "/public/illustrations/404-laptop.svg";

// types
import type { CommentType } from "@/lib/types";
// icons
import { FaUser } from "react-icons/fa";

type Props = {
  triggerBtn: ReactNode;
};

const GET_POST_COMMENTS = gql`
  query GetPostComments($commentData: GetPostCommentsData!) {
    getPostComments(commentData: $commentData) {
      isFinalPage
      comments {
        _id
        comment

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

const CommentsDialog = ({ triggerBtn }: Props) => {
  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const pageAndLimit = useRef({
    page: 1,
    limit: 2,
  });

  const { data, loading, error, fetchMore } = useQuery(GET_POST_COMMENTS);

  const comments = (data?.getPostComments?.comments || []) as CommentType[];
  const isFinalPage = data?.getPostComments?.isFinalPage;

  const handleFetchMore = () => {
    if (fetchMoreLoading || loading || isFinalPage) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: {
        requestsPagination: pageAndLimit.current,
      },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          getPostComments: {
            ...(fetchMoreResult?.getPostComments || {}),
            comments: [
              ...comments,
              ...(fetchMoreResult?.getPostComments?.friendsRequests || []),
            ],
            isFinalPage: !!fetchMoreResult?.getPostComments?.isFinalPage,
          },
        };
      },
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY + window.innerHeight;

      const isBottom = scrollPosition >= documentHeight - 150;

      if (isBottom) handleFetchMore();
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog>
      {triggerBtn}

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-secondary underline">
            Post Comments
          </DialogTitle>

          <VisuallyHidden>
            <DialogDescription>post comments list</DialogDescription>
          </VisuallyHidden>

          {loading && <Loading />}

          {!loading && error && !comments.length && (
            <IllustrationPage
              content="can't get this post comments at the momment"
              svg={_404SVG}
              btn={{ type: "custom", component: <></> }}
            />
          )}

          {!loading && !error && !comments.length && (
            <IllustrationPage
              svg={_404SVG}
              btn={{ type: "custom", component: <></> }}
              content="This post doesn't have any comments yet, <br />
              You can be the first."
            />
          )}

          {!!comments.length && (
            <ul>
              {comments.map(
                ({
                  _id,
                  owner: { _id: ownerId, username, profilePicture },
                  comment,
                }) => (
                  <li key={_id} className="flex items-start gap-1.5 flex-wrap">
                    <Link href={`user/${ownerId}`} className="peer">
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

                    <div className="peer-hover:[&_a]:underline bg-primary bg-opacity-30">
                      <Link
                        href={`user/${ownerId}`}
                        className="font-bold hover:underline"
                      >
                        {username}
                      </Link>
                      {comment && <p>{comment}</p>}
                    </div>
                  </li>
                )
              )}
            </ul>
          )}

          {fetchMoreLoading && <b>Loading...</b>}

          {!isFinalPage && !!comments.length && (
            <Button
              disabled={loading || fetchMoreLoading}
              onClick={handleFetchMore}
            >
              See More
            </Button>
          )}
        </DialogHeader>

        <CommentForm />
      </DialogContent>
    </Dialog>
  );
};
export default CommentsDialog;
