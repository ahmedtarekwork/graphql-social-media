// nextjs
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

// react
import { memo, useContext, useEffect, useState } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import Loading from "@/components/Loading";

// shadcn
import { Button } from "@/components/ui/button";

// icons
import { FaSearch, FaUser } from "react-icons/fa";

// gql
import { gql, useQuery } from "@apollo/client";

// types
import type { NotFullUserType } from "@/lib/types";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

const GET_USER_FRIENDS_COUNT = gql`
  query GetUserFriendsCount($userId: ID!) {
    getUserFriendsCount(userId: $userId) {
      count
    }
  }
`;
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
    }
  }
`;

const FriendsSection = () => {
  const { user } = useContext(authContext);
  const userIdParam = useParams()?.userId;

  const isCurrentUserProfile = useIsCurrentUserProfile();

  const [profileOwnerId, setProfileOwnerId] = useState(
    isCurrentUserProfile ? user!._id : userIdParam
  );

  const { data: friendsCountResponse, loading: friendsCountLoading } = useQuery(
    GET_USER_FRIENDS_COUNT,
    {
      variables: { userId: profileOwnerId },
    }
  );

  const {
    data: friendsResponse,
    loading: friendsLoading,
    error: friendsErr,
  } = useQuery(GET_USER_FRIENDS, {
    variables: {
      friendsPagination: { page: 1, limit: 9, userId: profileOwnerId },
    },
  });

  const friendsCount = friendsCountResponse?.getUserFriendsCount?.count || 0;
  const friends: NotFullUserType[] =
    friendsResponse?.getUserFriends?.friends || [];

  useEffect(() => {
    setProfileOwnerId(isCurrentUserProfile ? user!._id : userIdParam);
  }, [isCurrentUserProfile, user, userIdParam]);

  return (
    <div className="h-fit flex-1 sticky top-3 left-0 max-md:hidden border-2 rounded-md p-2 border-primary">
      <h2 className="text-primary font-bold text-2xl mb-3">
        <Link href="/friends" className="underline">
          {isCurrentUserProfile ? "Your " : ""}Friends
        </Link>

        {!friendsCountLoading && (
          <span>
            {" ("}
            {friendsCount}
            {")"}
          </span>
        )}
      </h2>

      {!!friends.length && (
        <ul
          className="grid gap-1"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 0.8fr))",
          }}
        >
          {friends.map(({ _id, profilePicture, username }) => (
            <li key={_id}>
              <Link href={`/user/${_id}`} className="block hover:underline">
                {profilePicture?.secure_url ? (
                  <div className="mx-auto">
                    <Image
                      alt="user profile picture"
                      src={profilePicture?.secure_url}
                      width={90}
                      height={90}
                    />
                  </div>
                ) : (
                  <div className="bg-primary grid place-content-center h-[90px] w-[90px] mx-auto">
                    <FaUser size={35} className="fill-white" />
                  </div>
                )}
                <b className="mt-1.5 block">{username}</b>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {friendsLoading && <Loading size={16} withText withFullHeight={false} />}
      {friendsErr && !friendsLoading && (
        <p className="text-center">
          can{"'"}t get {isCurrentUserProfile ? "your" : "this user"} friends at
          the momment
        </p>
      )}

      {isCurrentUserProfile && !friendsCount && !friendsCountLoading && (
        <>
          <p className="text-center mb-2">Add some friends to see them here</p>
          <Button className="mx-auto flex" asChild>
            <Link href="/peopleMayKnow">
              <FaSearch />
              explore people
            </Link>
          </Button>
        </>
      )}

      {!isCurrentUserProfile && !friendsCount && !friendsCountLoading && (
        <p className="text-center mb-2">
          This user doesn{`'`}t have any friends yet
        </p>
      )}
    </div>
  );
};
export default memo(FriendsSection);
