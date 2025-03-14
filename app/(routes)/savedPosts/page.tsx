"use client";

// nextjs
import Link from "next/link";
import Image from "next/image";

// react
import { useEffect, useRef, useState } from "react";

// shadcn
import { Button } from "@/components/ui/button";

// components
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";

// gql
import { gql, useQuery } from "@apollo/client";

// types
import type { ImageType, PostType } from "@/lib/types";

// SVGs
import _404SVG from "/public/illustrations/404.svg";
import bookmarksSVG from "/public/illustrations/Bookmarks.svg";

// icons
import { FaBookmark } from "react-icons/fa";
import { TfiNewWindow } from "react-icons/tfi";
import { FaArrowRotateLeft } from "react-icons/fa6";

const GET_CURRENT_USER_SAVED_POSTS = gql`
  query GetUserSavedPosts($postsPaginations: PaginatedItemsInput!) {
    getUserSavedPosts(postsPaginations: $postsPaginations) {
      isFinalPage
      savedPosts {
        _id
        caption
        media {
          secure_url
        }
      }
    }
  }
`;

const SavedPostsPage = () => {
  const pageAndLimit = useRef({
    page: 1,
    limit: 10,
  });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const { loading, data, error, fetchMore } = useQuery(
    GET_CURRENT_USER_SAVED_POSTS,
    {
      variables: {
        postsPaginations: pageAndLimit.current,
      },
    }
  );

  const savedPosts = (data?.getUserSavedPosts?.savedPosts || []) as (Pick<
    PostType,
    "_id" | "caption"
  > & { media: ImageType })[];
  const isFinalPage = data?.getUserSavedPosts?.isFinalPage;

  const handleFetchMore = () => {
    if (fetchMoreLoading || loading || isFinalPage || error) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: {
        postsPaginations: pageAndLimit.current,
      },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          getUserSavedPosts: {
            savedPosts: [
              ...savedPosts,
              ...(fetchMoreResult?.getUserSavedPosts?.savedPosts || []),
            ],
            isFinalPage: !!fetchMoreResult?.getUserSavedPosts?.isFinalPage,
          },
        };
      },
    });
  };

  useEffect(() => {
    const handleScroll = async () => {
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

  if (loading) {
    return <Loading />;
  }

  if (!loading && error && !savedPosts.length) {
    return (
      <IllustrationPage
        content="can't get your saved posts at the momment"
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
        svg={_404SVG}
      />
    );
  }

  if (!loading && !error && !savedPosts.length) {
    return (
      <IllustrationPage
        content="You don't have any saved posts, explore some posts and save them to see them here."
        btn={{ type: "go-to-home" }}
        svg={bookmarksSVG}
      />
    );
  }

  return (
    <div className="mt-4">
      <ul className="space-y-1">
        {savedPosts.map(({ _id, caption, media }) => (
          <li key={_id}>
            <Link
              href={`/post/${_id}`}
              className="overflow-hidden flex items-center hover:underline bg-primary bg-opacity-25 rounded-sm shadow-md transition duration-200 hover:bg-opacity-40 group"
            >
              {media?.secure_url ? (
                <div className="relative overflow-hidden rounded-sm">
                  <Image
                    src={media.secure_url}
                    alt="post thumbnail"
                    width={100}
                    height={100}
                    className="aspect-[1] object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-45 grid place-content-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <TfiNewWindow fill="white" size={30} />
                  </div>
                </div>
              ) : (
                <div className="bg-primary rounded-sm grid place-content-center w-[100px] h-[100px] group-hover:bg-secondary transition duration-200">
                  <FaBookmark size={40} fill="white" />
                </div>
              )}
              {caption && <b className="p-1.5 truncate">{caption}</b>}
            </Link>
          </li>
        ))}
      </ul>

      {!isFinalPage && (
        <Button
          title="get more saved posts"
          onClick={handleFetchMore}
          className="w-fit mx-auto mt-4"
          disabled={fetchMoreLoading || loading}
        >
          {fetchMoreLoading || loading ? "Loading..." : "See more"}
        </Button>
      )}

      {fetchMoreLoading && (
        <Loading size={16} withText withFullHeight={false} />
      )}
    </div>
  );
};
export default SavedPostsPage;
