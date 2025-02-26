// nextjs
import Link from "next/link";
import Image from "next/image";

// react
import { useContext, useEffect, useRef, useState } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import SharePostBtn from "./SharePostBtn";
import IllustrationPage from "@/components/IllustrationPage";
import Loading from "@/components/Loading";

// shadcn
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// icons
import { FaShare, FaUser } from "react-icons/fa";
import { FaArrowRotateLeft } from "react-icons/fa6";

// gql
import { gql, useLazyQuery } from "@apollo/client";

// types
import type { NotFullUserType } from "@/lib/types";
import { type InsideProfileType } from "../PostCard";

// SVGs
import commentsSVG from "/public/illustrations/comments.svg";

type Props = {
  postId: string;
  postOwnerId: string;
  sharesCount: number;
  isShared: boolean;
  fetchMethodName: string;
} & Pick<InsideProfileType, "mode" | "updateQuery">;

const GET_POST_SHARES = gql`
  query GetPostSharesUsers($sharesInfo: SharesInfoInput!) {
    getPostSharesUsers(sharesInfo: $sharesInfo) {
      isFinalPage
      shares {
        _id
        username
        profilePicture {
          secure_url
          public_id
        }
      }
    }
  }
`;

const DisplayPostShares = ({
  postId,
  sharesCount,
  postOwnerId,
  isShared,
  mode,
  updateQuery,
  fetchMethodName,
}: Props) => {
  const { user } = useContext(authContext);

  const pageAndLimit = useRef({
    page: 1,
    limit: 2,
  });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const [getPostShares, { loading, error, data, fetchMore }] = useLazyQuery(
    GET_POST_SHARES,
    {
      variables: {
        sharesInfo: {
          postId,
          ...pageAndLimit.current,
        },
      },
    }
  );

  const shares = (data?.getPostSharesUsers?.shares || []) as NotFullUserType[];
  const isFinalPage = data?.getPostSharesUsers?.isFinalPage;

  useEffect(() => {
    if (sharesCount && !data) getPostShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharesCount, data]);

  const handleFetchMore = () => {
    if (fetchMoreLoading || isFinalPage || loading || error) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: {
        sharesInfo: {
          postId,
          ...pageAndLimit.current,
        },
      },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          getPostSharesUsers: {
            shares: [
              ...shares,
              ...(fetchMoreResult?.getPostSharesUsers?.shares || []),
            ],
            isFinalPage: !!fetchMoreResult?.getPostSharesUsers?.isFinalPage,
          },
        };
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger className="flex items-center flex-wrap pb-0.5 gap-1 text-primary transition duration-100 text-sm border-b border-b-transparent hover:border-primary">
        <FaShare size={16} className="fill-primary" />
        {sharesCount}
      </DialogTrigger>

      <DialogContent
        aria-describedby={`post-${postId}-shares`}
        className="overflow-auto"
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          const isBottom = scrollTop + clientHeight >= scrollHeight;

          if (isBottom) handleFetchMore();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-secondary underline">
            Post Shares
          </DialogTitle>

          <VisuallyHidden>
            <DialogDescription>post {postId} shares list</DialogDescription>
          </VisuallyHidden>

          {loading && <Loading />}

          {error && !loading && (
            <IllustrationPage
              btn={{
                type: "custom",
                component: (
                  <Button
                    className="mx-auto"
                    onClick={() => window.location.reload()}
                    title="refresh the page"
                  >
                    <FaArrowRotateLeft />
                    refresh page
                  </Button>
                ),
              }}
              content="can't get this post comments at the momment"
              svg={commentsSVG}
            />
          )}

          {!sharesCount && !error && !loading && (
            <div className="font-bold">
              <p className="pb-1.5">
                This post doesn{"'"}t have any shares yet, <br />
                {user?._id !== postOwnerId && (
                  <>
                    You can be the first. <br />
                  </>
                )}
              </p>

              {user?._id !== postOwnerId && (
                <SharePostBtn
                  isShared={!!isShared}
                  postId={postId}
                  btnVariant="default"
                  mode={mode}
                  updateQuery={updateQuery}
                  fetchMethodName={fetchMethodName}
                />
              )}
            </div>
          )}

          {!!sharesCount && !error && !loading && (
            <>
              <ul className="spze-y-2">
                {shares.map(({ _id, username, profilePicture }, i) => (
                  <li key={_id}>
                    <Link
                      href={`/user/${_id}`}
                      className="w-fit flex items-center gap-1.5 flex-wrap hover:underline"
                    >
                      {profilePicture?.secure_url ? (
                        <Image
                          alt={`user profile picture No. ${i + 1}`}
                          src={profilePicture.secure_url}
                          width={70}
                          height={70}
                          className="aspect-[1] object-contain rounded-sm"
                        />
                      ) : (
                        <div className="w-[70px] h-[70px] rounded-sm bg-primary grid place-content-center">
                          <FaUser size={20} className="fill-white" />
                        </div>
                      )}

                      <b className="text-black">{username}</b>
                    </Link>
                  </li>
                ))}
              </ul>

              {fetchMoreLoading && (
                <Loading size={16} withText withFullHeight={false} />
              )}

              {!isFinalPage && (
                <Button
                  onClick={handleFetchMore}
                  disabled={fetchMoreLoading || loading}
                  title="get post shares"
                >
                  See More
                </Button>
              )}
            </>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
export default DisplayPostShares;
