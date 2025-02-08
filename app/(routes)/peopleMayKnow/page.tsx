"use client";

// nextjs
import Link from "next/link";

// react
import { useEffect, useRef, useState } from "react";

// components
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";
import UserCard from "@/components/UserCard";
// shadcn
import { Button } from "@/components/ui/button";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import worldSVG from "/public/illustrations/world.svg";
import buzzleSVG from "/public/illustrations/buzzle.svg";

// types
import type { NotFullUserType } from "@/lib/types";

const GET_PEOPLE = gql`
  query GetAllUsers($wantedUsers: PaginatedItemsInput!) {
    getAllUsers(wantedUsers: $wantedUsers) {
      users {
        _id
        username
        profilePicture {
          secure_url
        }
      }

      isFinalPage
    }
  }
`;

const PeopleMayKnowPage = () => {
  const pageAndLimit = useRef({ page: 1, limit: 10 });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { loading, error, fetchMore, data } = useQuery(GET_PEOPLE, {
    variables: {
      wantedUsers: pageAndLimit.current,
    },
  });

  useEffect(() => {
    console.log("data", data);
  }, [data]);

  const users = data?.getAllUsers?.users || [];

  if (loading) return <Loading />;

  if (error && !loading && !users.length) {
    return (
      <IllustrationPage
        content="can't get people at the momment!"
        btn={{ type: "go-to-home" }}
        svg={worldSVG}
      />
    );
  }

  if (!users.length && !error && !loading) {
    return (
      <IllustrationPage
        content="No users have been register in our database, be the first"
        btn={{
          type: "custom",
          component: (
            <Button asChild className="w-fit mx-auto">
              <Link href="/signup">Register</Link>
            </Button>
          ),
        }}
        svg={buzzleSVG}
      />
    );
  }

  const handleFetchMoreUsers = () => {
    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: pageAndLimit.current,
      updateQuery(_, { fetchMoreResult }) {
        if (!fetchMoreResult) return data;

        setFetchMoreLoading(false);

        return {
          getAllUsers: {
            users: [
              ...(data?.getAllUsers?.users || []),
              ...(fetchMoreResult?.getAllUsers?.users || []),
            ],
            isFinalPage: !!fetchMoreResult?.getAllUsers?.isFinalPage,
          },
        };
      },
    });
  };

  return (
    <div className="mt-4">
      <h1 className="font-bold text-2xl underline underline-offset-[7px] text-primary mb-4">
        People You May Know
      </h1>

      <ul
        className="grid gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 0.8fr))",
        }}
      >
        {users.map((user: NotFullUserType) => (
          <UserCard
            user={user}
            cardMode="COLUMN"
            btnsType="VIEW_PROFILE"
            key={user._id}
          />
        ))}
      </ul>

      {!data?.getAllUsers?.isFinalPage && (
        <Button
          className="block mx-auto"
          onClick={handleFetchMoreUsers}
          disabled={fetchMoreLoading}
        >
          See more
        </Button>
      )}
      {fetchMoreLoading && <b>Loading...</b>}
    </div>
  );
};
export default PeopleMayKnowPage;
