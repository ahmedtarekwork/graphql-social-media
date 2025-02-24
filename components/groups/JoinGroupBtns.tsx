// nextjs
import { useParams } from "next/navigation";

// components
import Loading from "../Loading";

// shadcn
import { Button } from "../ui/button";

// icons
import { IoExit } from "react-icons/io5";
import { FaCentercode, FaCheckCircle } from "react-icons/fa";

// gql
import { gql, useMutation, useQuery } from "@apollo/client";

// utils
import { toast } from "sonner";

// types
import type { GroupType, ReturnTypeOfUseQuery } from "@/lib/types";

type Props = {
  isMember: boolean;
  groupPrivacy: GroupType["privacy"];
  isUserMemberInGroupUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
};

const JOIN_GROUP = gql`
  mutation JoinGroup($groupId: ID!) {
    joinGroup(groupId: $groupId) {
      message
    }
  }
`;
const EXIT_GROUP = gql`
  mutation ExitGroup($groupId: ID!) {
    exitGroup(groupId: $groupId) {
      message
    }
  }
`;
const IS_USER_SENT_JOIN_REQUEST_TO_GROUP = gql`
  query IsUserSentJoinRequest($groupId: ID!) {
    isUserSentJoinRequest(groupId: $groupId) {
      isUserSentJoinRequest
    }
  }
`;

const JoinGroupBtns = ({
  isMember,
  groupPrivacy,
  isUserMemberInGroupUpdateQuery,
}: Props) => {
  const groupId = useParams()?.groupId as string;

  const {
    loading: isUserSentJoinRequestLoading,
    data: isUserSentJoinRequest,
    updateQuery: isUserSentJoinRequestUpdateQuery,
  } = useQuery(IS_USER_SENT_JOIN_REQUEST_TO_GROUP, {
    variables: { groupId },
  });

  const [joinGroup, { loading: joinGroupLoading }] = useMutation(JOIN_GROUP, {
    variables: { groupId },

    onCompleted(data) {
      switch (groupPrivacy) {
        case "public": {
          isUserMemberInGroupUpdateQuery((prev) => ({
            ...prev!,
            isUserMemberInGroup: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev as any)?.isUserMemberInGroup,
              isUserMemberInGroup: true,
            },
          }));
          break;
        }
        case "members_only": {
          isUserSentJoinRequestUpdateQuery((prev) => ({
            ...prev!,
            isUserSentJoinRequest: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev as any)?.isUserSentJoinRequest,
              isUserSentJoinRequest: true,
            },
          }));
          break;
        }
      }

      toast.success(
        data?.joinGroup?.message ||
          (groupPrivacy === "public"
            ? "you are joined to the group successfully"
            : "join request has been sent to group admins")
      );
    },

    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          `can't ${
            groupPrivacy === "members_only"
              ? "send join request to admins"
              : "make you a member"
          } at the momment`
      );
    },
  });

  const [exitGroup, { loading: exitGroupLoading }] = useMutation(EXIT_GROUP, {
    variables: { groupId },

    onCompleted(data) {
      isUserMemberInGroupUpdateQuery((prev) => ({
        ...prev!,
        isUserMemberInGroup: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(prev as any)?.isUserMemberInGroup,
          isUserMemberInGroup: false,
        },
      }));

      toast.success(
        data?.exitGroup?.message || "you exit from group successfully"
      );
    },

    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't exit you from group at the mommebt"
      );
    },
  });

  if (isUserSentJoinRequestLoading) {
    return (
      <Button disabled>
        <Loading size={18} withText fill="white" />
      </Button>
    );
  }

  if (isUserSentJoinRequest?.isUserSentJoinRequest?.isUserSentJoinRequest) {
    return (
      <div className="bg-accent flex items-center gap-2 flex-wrap rounded-sm p-2">
        <FaCheckCircle className="fill-primary" size={18} />
        join request sent
      </div>
    );
  }

  if (isMember) {
    return (
      <Button onClick={() => exitGroup()} disabled={exitGroupLoading}>
        {exitGroupLoading ? (
          <Loading size={18} fill="white" withFullHeight={false} />
        ) : (
          <IoExit size={18} />
        )}
        exit from group
      </Button>
    );
  }

  if (!isMember) {
    return (
      <Button onClick={() => joinGroup()} disabled={joinGroupLoading}>
        {joinGroupLoading ? (
          <Loading size={18} fill="white" withFullHeight={false} />
        ) : (
          <FaCentercode size={18} />
        )}
        join group
      </Button>
    );
  }
};
export default JoinGroupBtns;
