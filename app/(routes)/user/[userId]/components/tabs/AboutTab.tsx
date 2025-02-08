// types
import type { UserType } from "@/lib/types";

// gql
import { gql, useQuery } from "@apollo/client";

type Props = {
  profileOwner: UserType;
};

const GET_USER_FRIENDS_COUNT = gql`
  query GetUserFriendsCount($userId: ID!) {
    getUserFriendsCount(userId: $userId) {
      count
    }
  }
`;

const AboutTab = ({ profileOwner }: Props) => {
  const { data: friendsCountResponse, loading: friendsCountLoading } = useQuery(
    GET_USER_FRIENDS_COUNT,
    {
      variables: { userId: profileOwner._id },
    }
  );

  return (
    <ul className="[&>*:nth-child(odd)]:bg-primary [&>*:nth-child(odd)]:bg-opacity-20 [&>*]:p-2">
      <li>
        username: <b className="text-secondary">{profileOwner.username}</b>
      </li>
      <li>
        email: <b className="text-secondary">{profileOwner.email}</b>
      </li>
      <li>
        followed pages:{" "}
        <b className="text-secondary">
          {profileOwner.followedPages.length} pages
        </b>
      </li>
      <li>
        joined groups:{" "}
        <b className="text-secondary">
          {profileOwner.joinedGroups.length} groups
        </b>
      </li>
      <li>
        friends count:{" "}
        <b className="text-secondary">
          {friendsCountLoading
            ? "Loading..."
            : `${friendsCountResponse?.getUserFriendsCount?.count} friend`}
        </b>
      </li>
    </ul>
  );
};
export default AboutTab;
