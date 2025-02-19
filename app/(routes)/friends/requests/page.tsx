"use client";

// nextjs
import Link from "next/link";

// react
import { useEffect, useRef, useState } from "react";

// components
import IllustrationPage from "@/components/IllustrationPage";
import UserCard from "@/components/UserCard";
import Loading from "@/components/Loading";
// shadcn
import { Button } from "@/components/ui/button";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import errorSVG from "/public/illustrations/error-laptop.svg";
import searchSVG from "/public/illustrations/search.svg";

// types
import type { NotFullUserType } from "@/lib/types";

// icons
import { FaSearch } from "react-icons/fa";
import { FaArrowRotateLeft } from "react-icons/fa6";
import HandleFriendshipRequestBtn from "@/components/friends/HandleFriendshipRequestBtn";

const GET_USER_FRIENDSHIP_REQUESTS = gql`
  query GetUserFriendsRequests($requestsPagination: PaginatedItemsInput!) {
    getUserFriendsRequests(requestsPagination: $requestsPagination) {
      friendsRequests {
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

const FriendsRequestsPage = () => {
  const pageAndLimit = useRef({ page: 1, limit: 20 });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { loading, error, data, fetchMore, updateQuery } = useQuery(
    GET_USER_FRIENDSHIP_REQUESTS,
    {
      variables: {
        requestsPagination: pageAndLimit.current,
      },
    }
  );

  const friendshipRequests =
    data?.getUserFriendsRequests?.friendsRequests || [];
  const isFinalPage = data?.getUserFriendsRequests?.isFinalPage;

  const handleFetchMoreFriendshipRequests = () => {
    if (fetchMoreLoading || loading || isFinalPage || error) return;

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
          getUserFriendsRequests: {
            friendsRequests: [
              ...friendshipRequests,
              ...(fetchMoreResult?.getUserFriendsRequests?.friendsRequests ||
                []),
            ],
            isFinalPage: !!fetchMoreResult?.getUserFriendsRequests?.isFinalPage,
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

      if (isBottom) handleFetchMoreFriendshipRequests();
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  if (error && !loading) {
    return (
      <IllustrationPage
        btn={{
          type: "custom",
          component: (
            <Button className="mx-auto">
              <FaArrowRotateLeft />
              refesh page
            </Button>
          ),
        }}
        content="Can't get Your friendship requests at the momment"
        svg={errorSVG}
      />
    );
  }

  if (!friendshipRequests.length && !error && !loading) {
    return (
      <IllustrationPage
        btn={{
          type: "custom",
          component: (
            <Button asChild>
              <Link href="/peopleMayKnow">
                <FaSearch size={19} fill="white" />
                Explore Other Users
              </Link>
            </Button>
          ),
        }}
        content="You don't have any friendship requests, but you can send some of it."
        svg={searchSVG}
      />
    );
  }

  return (
    <>
      <h1 className="font-bold text-2xl text-primary underline underline-offset-[7px] mt-4">
        Friendship Requests
      </h1>

      {!friendshipRequests.length && !loading && !error && (
        <p className="mt-5 font-bold text-primary text-center text-3xl">
          No friendship requests to show it.
        </p>
      )}

      <ul
        className="grid mt-5 gap-2 justify-center"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 0.8fr))",
        }}
      >
        {friendshipRequests.map((user: NotFullUserType) => {
          return (
            <UserCard
              key={user._id}
              user={user}
              btnType="CUSTOM"
              cardMode="COLUMN"
              customCardBtn={({ btnStyle }) => (
                <HandleFriendshipRequestBtn
                  updateQuery={updateQuery}
                  userId={user._id}
                  btnStyle={btnStyle}
                />
              )}
            />
          );
        })}
      </ul>

      {!isFinalPage && (
        <Button
          onClick={handleFetchMoreFriendshipRequests}
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
export default FriendsRequestsPage;
