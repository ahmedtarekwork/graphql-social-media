// nextjs
import Link from "next/link";

// react
import { useRef, useState } from "react";

// gql
import { gql, useQuery } from "@apollo/client";

// components
import Loading from "../Loading";
import IllustrationPage from "../IllustrationPage";
import UserCard from "../UserCard";
// shadcn
import { Button } from "../ui/button";

// icons
import { FaExternalLinkAlt } from "react-icons/fa";
import { FaArrowRotateLeft } from "react-icons/fa6";

// types
import type { NotFullUserType } from "@/lib/types";

// SVGs
import emptySVG from "/public/illustrations/search.svg";
import errorLaptopSVG from "/public/illustrations/error-laptop.svg";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

type Props = { userId: string; mode: "ROW" | "COLUMN" };

const GET_USER_FRIENDS = gql`
  query GetUserFriends($friendsPagination: GetUserFriendsInput!) {
    getUserFriends(friendsPagination: $friendsPagination) {
      friends {
        _id
        username
        profilePicture {
          secure_url
          public_id
        }
      }
      isFinalPage
    }
  }
`;

const Friends = ({ userId, mode }: Props) => {
  const isCurrentUserProfile = useIsCurrentUserProfile();

  const pageAndLimit = useRef({ page: 1, limit: 9 });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { loading, error, fetchMore, data } = useQuery(GET_USER_FRIENDS, {
    variables: {
      friendsPagination: { ...pageAndLimit.current, userId: userId },
    },
  });

  const friends: NotFullUserType[] = data?.getUserFriends?.friends || [];
  const isFinalPage = data?.getUserFriends?.isFinalPage;

  if (loading && !friends.length) return <Loading />;

  if (error && !loading && !friends.length) {
    return (
      <IllustrationPage
        content={`can't get ${
          isCurrentUserProfile ? "your" : "this user"
        } friends at the momment.`}
        svg={errorLaptopSVG}
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
      />
    );
  }

  if (!friends.length && !loading && !error) {
    return (
      <IllustrationPage
        content={`${
          isCurrentUserProfile ? "You" : "This user"
        } don't have any friends yet`}
        btn={{
          type: "custom",
          component: isCurrentUserProfile ? (
            <Button asChild className="w-fit mx-auto">
              <Link href="/peopleMayKnow">
                <FaExternalLinkAlt />
                add some friends
              </Link>
            </Button>
          ) : (
            <></>
          ),
        }}
        svg={emptySVG}
      />
    );
  }

  const handleFetchMoreFriends = () => {
    if (isFinalPage || fetchMoreLoading || error || loading) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: {
        friendsPagination: { ...pageAndLimit.current, userId: userId },
      },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          getUserFriends: {
            isFinalPage: !!fetchMoreResult?.getUserFriends?.isFinalPage,
            friends: [
              ...(data?.getUserFriends?.friends || []),
              ...(fetchMoreResult?.getUserFriends?.friends || []),
            ],
          },
        };
      },
    });
  };

  return (
    <>
      <ul
        className={mode === "ROW" ? "space-y-1.5" : "grid gap-2 justify-center"}
        style={{
          gridTemplateColumns:
            mode === "COLUMN"
              ? "repeat(auto-fill, minmax(150px, 0.85fr))"
              : undefined,
        }}
      >
        {friends.map((user) => (
          <UserCard
            user={user}
            key={user._id}
            btnType="VIEW_PROFILE"
            cardMode={mode}
          />
        ))}
      </ul>

      {!isFinalPage && (
        <Button
          onClick={handleFetchMoreFriends}
          className="w-fit mx-auto mt-4"
          disabled={fetchMoreLoading || loading}
        >
          {fetchMoreLoading || loading ? "Loading..." : "See more"}
        </Button>
      )}

      {fetchMoreLoading && (
        <Loading size={16} withText withFullHeight={false} />
      )}
    </>
  );
};
export default Friends;
