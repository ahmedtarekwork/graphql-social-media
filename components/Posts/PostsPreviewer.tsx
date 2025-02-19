"use client";

// nextjs
import { useParams } from "next/navigation";

// react
import {
  useState,
  useContext,
  useEffect,
  useRef,

  // types
  type Dispatch,
  type SetStateAction,
  type MutableRefObject,
} from "react";

// contexts
import { PostsContext } from "@/contexts/PostsContext";

// shadcn
import { Button } from "../ui/button";

// components
import IllustrationPage from "../IllustrationPage";
import Loading from "../Loading";
import PostCard from "./PostCard";

// SVGs
import PostsSVG from "/public/illustrations/posts.svg";
import PostsDeviceSVG from "/public/illustrations/posts-device.svg";

// types
import type { PostsResponse, UserType } from "@/lib/types";

// utils
import { toast } from "sonner";

// gql
import { type DocumentNode, gql, useQuery } from "@apollo/client";

// icons
import { FaArrowRotateLeft } from "react-icons/fa6";

type ModeType =
  | {
      mode: "profilePage";
      isCurrentUserProfile: boolean;
      profileOwner: UserType;
      skipCount: MutableRefObject<number>;
      stopFetchMore: boolean;
      setStopFetchMore: Dispatch<SetStateAction<boolean>>;
      normalUser?: never;
    }
  | {
      mode: "homePage";
      isCurrentUserProfile?: never;
      profileOwner?: never;
      skipCount?: never;
      stopFetchMore?: never;
      setStopFetchMore?: never;
      normalUser?: never;
    }
  | {
      mode: "singlePageInfoPage";
      isCurrentUserProfile?: never;
      profileOwner?: never;
      skipCount: MutableRefObject<number>;
      stopFetchMore: boolean;
      setStopFetchMore: Dispatch<SetStateAction<boolean>>;
      normalUser: boolean;
    };

type Props = {
  fetchMoreLoading: boolean;
  setFetchMoreLoading: Dispatch<SetStateAction<boolean>>;
} & ModeType;

const PostsPreviewer = ({
  isCurrentUserProfile,
  skipCount,
  profileOwner,
  fetchMoreLoading,
  setFetchMoreLoading,
  stopFetchMore,
  setStopFetchMore,
  mode,
  normalUser,
}: Props) => {
  const pageId = (useParams()?.pageId || "") as string;

  const variables = {
    inputType: "PaginatedItemsInput",
    methodName: "getHomePagePosts",
  };

  switch (mode) {
    case "profilePage": {
      variables.inputType = isCurrentUserProfile
        ? "PaginatedItemsInputWithSkipInput"
        : "PaginatedPostsForSpecificUserInput";

      variables.methodName = `get${
        isCurrentUserProfile ? "Current" : "Single"
      }UserPosts`;
      break;
    }

    case "singlePageInfoPage": {
      variables.inputType = "PaginatedItemsInputWithIdAndSkip";
      variables.methodName = `getPagePosts`;
      break;
    }
  }

  const GET_POSTS = (): DocumentNode => {
    return gql`
    query GetUserPosts(
      $paginatedPosts: ${variables.inputType}!
    ) {
      ${variables.methodName}(paginatedPosts: $paginatedPosts) {
        isFinalPage
        posts {
          _id
          blockComments
          isInBookMark
          caption
          commentsCount
          privacy
          shareDate
          community
          isShared

          communityInfo {
            _id
            name
            profilePicture {
              secure_url
              public_id
            }
          }

          sharePerson {
            _id
            username
            profilePicture {
              secure_url
              public_id
            }
          }
  
          media {
            secure_url
            public_id
          }
          owner {
            profilePicture {
              secure_url
              public_id
            }
            username
            _id
          }
  
          shareData {
            count
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
  };

  const { data, setData } = useContext(PostsContext);

  const pageAndLimit = useRef({ page: 1, limit: 2 });
  const isWantToFetch = useRef(false);

  const [disableGetPosts, setDisableGetPosts] = useState(false);

  const queryVariables = () => ({
    paginatedPosts: {
      ...pageAndLimit.current,

      ...(mode === "profilePage" && !isCurrentUserProfile
        ? { userId: profileOwner._id }
        : {}),

      ...(mode === "singlePageInfoPage" ? { pageId } : {}),

      ...(["profilePage", "singlePageInfoPage"].includes(mode)
        ? { skip: skipCount?.current || 0 }
        : {}),
    },
  });

  const {
    loading,
    error,
    fetchMore,
    updateQuery,
    data: getPostsData,
  } = useQuery(GET_POSTS(), {
    variables: queryVariables(),
    skip: disableGetPosts,
  });

  const posts = data.posts;
  const isFinalPage = data.isFinalPage;

  const handleFetchMore = async () => {
    if (isFinalPage || loading || fetchMoreLoading || stopFetchMore || error)
      return;

    if (pageAndLimit.current) pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);

    try {
      const fetchMoreData = await fetchMore({
        variables: queryVariables(),
      });

      const newData = fetchMoreData.data?.[
        variables.methodName as keyof typeof fetchMoreData.data
      ] as unknown as PostsResponse;

      if (newData) {
        setData((prev) => {
          return {
            isFinalPage: !!newData.isFinalPage,
            posts: [...prev.posts, ...newData.posts],
          };
        });
      } else {
        toast.error("can't get more posts at the momment", {
          duration: 5500,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      toast.error("can't get more posts at the momment", {
        duration: 5500,
      });
    } finally {
      setFetchMoreLoading(false);
    }
  };

  useEffect(() => {
    if (getPostsData) {
      const initDataResult =
        getPostsData[variables.methodName as keyof typeof getPostsData];

      if (!disableGetPosts && initDataResult) {
        setData(initDataResult);
        setDisableGetPosts(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPostsData]);

  useEffect(() => {
    const handleScroll = async () => {
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY + window.innerHeight;

      const isBottom = scrollPosition >= documentHeight - 150;

      if (stopFetchMore && isBottom) {
        isWantToFetch.current = true;
      }

      if (isBottom) handleFetchMore();
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isFinalPage, fetchMoreLoading, stopFetchMore]);

  useEffect(() => {
    if (!stopFetchMore && isWantToFetch.current) {
      if (!fetchMoreLoading) handleFetchMore();

      isWantToFetch.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopFetchMore, fetchMoreLoading]);

  if (loading) {
    return <Loading withFullHeight={false} />;
  }

  if (!posts.length && error && !loading) {
    let ownerName = isCurrentUserProfile ? "your" : "this user";

    if (mode === "homePage") ownerName = "home page";
    if (mode === "singlePageInfoPage") ownerName = "this page";

    return (
      <IllustrationPage
        svg={PostsSVG}
        btn={{
          type: "custom",
          component: (
            <Button
              className="mx-auto"
              onClick={() => window.location.reload()}
            >
              <FaArrowRotateLeft />
              refresh page
            </Button>
          ),
        }}
        content={`Can't get ${ownerName} posts at the momment`}
      />
    );
  }

  if (!posts.length && !error && !loading) {
    let message = isCurrentUserProfile
      ? "You don't have posts, add some posts to see it here"
      : "This user doesn't have any posts";

    if (mode === "homePage")
      message =
        "There is no posts for you, follow some pages or join groups or get some friends to see there posts";

    if (mode === "singlePageInfoPage")
      message = "This page doesn't have any posts at this time";

    return (
      <IllustrationPage
        content={message}
        btn={{
          type: "custom",
          component: <></>,
        }}
        svg={PostsDeviceSVG}
      />
    );
  }

  const postCardProps: Record<string, unknown> =
    mode === "homePage"
      ? { mode, updateQuery }
      : {
          mode,
          skipCount,
          fetchMoreLoading,
          setStopFetchMore,
        };

  if (mode === "singlePageInfoPage") postCardProps.normalUser = normalUser;

  return (
    <>
      <ul className="space-y-3">
        {posts.filter(Boolean).map((post) => {
          return (
            <PostCard
              fetchMethodName={variables.methodName}
              post={post}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...(postCardProps as any)}
              TagName="li"
              key={post._id}
            />
          );
        })}
      </ul>

      {(fetchMoreLoading || (stopFetchMore && isWantToFetch.current)) && (
        <Loading size={16} withText withFullHeight={false} />
      )}
    </>
  );
};

export default PostsPreviewer;
