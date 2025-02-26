// nextjs
import { useParams } from "next/navigation";

// react
import { ComponentProps, ReactNode, useRef, useState } from "react";

// components
import IllustrationPage from "../IllustrationPage";
import Loading from "../Loading";
import UserCard from "../UserCard";

// shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "../ui/button";

// gql
import { gql, useMutation, useQuery } from "@apollo/client";

// icons
import { FaCheckCircle, FaEnvelope, FaTimesCircle } from "react-icons/fa";

// SVGs
import _404 from "/public/illustrations/404.svg";
import requestSVG from "/public/illustrations/request.svg";

// utils
import classNames from "classnames";
import { toast } from "sonner";

// types
import type { NotFullUserType, ReturnTypeOfUseQuery } from "@/lib/types";

type GroupJoinRequestType = { _id: string; user: NotFullUserType };

const GET_JOIN_REQUESTS = gql`
  query GetGroupJoinRequest($requestsPaginationInfo: GetGroupRequestsInput!) {
    getGroupJoinRequests(requestsPaginationInfo: $requestsPaginationInfo) {
      isFinalPage
      requests {
        _id
        user {
          _id
          username
          profilePicture {
            public_id
            secure_url
          }
        }
      }
    }
  }
`;

const GET_JOIN_REQUESTS_COUNT = gql`
  query GetGroupJoinRequestCount($groupId: ID!) {
    joinRequestsCount(groupId: $groupId) {
      count
    }
  }
`;

const HANDLE_JOIN_REQUEST = gql`
  mutation HandleGroupJoinRequest(
    $handleGroupRequestData: HandleGroupRequestInput!
  ) {
    handleGroupRequest(handleGroupRequestData: $handleGroupRequestData) {
      message
    }
  }
`;

const Wrapper = ({
  children,
  props,
}: {
  children: ReactNode;
  props?: ComponentProps<"div">;
}) => {
  return (
    <DialogContent
      className="overflow-auto"
      aria-describedby="group-join-requests-dialog"
      {...(props || {})}
    >
      <DialogHeader>
        <DialogTitle className="text-primary mb-3 font-bold text-2xl underline underline-offset-[7px]">
          Join Requests
        </DialogTitle>
        <VisuallyHidden>
          <DialogDescription>Group Join Requests</DialogDescription>
        </VisuallyHidden>
        {children}
      </DialogHeader>
    </DialogContent>
  );
};

const JoinRequestsListContent = ({
  updateJoinRequestsCountQuery,
}: {
  updateJoinRequestsCountQuery: ReturnTypeOfUseQuery["updateQuery"];
}) => {
  const groupId = (useParams()?.groupId || "") as string;

  const pageAndLimit = useRef<Record<"page" | "limit", number>>({
    page: 1,
    limit: 2,
  });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { data, loading, error, fetchMore, updateQuery } = useQuery(
    GET_JOIN_REQUESTS,
    {
      variables: {
        requestsPaginationInfo: {
          groupId,
          ...pageAndLimit.current,
        },
      },
    }
  );

  const [handleJoinRequest, { loading: handleJoinRequestLoading }] =
    useMutation(HANDLE_JOIN_REQUEST, {
      onCompleted(data, options) {
        const variables = options?.variables?.handleGroupRequestData;

        updateQuery((prev) => {
          return {
            ...prev,
            getGroupJoinRequests: {
              ...prev.getGroupJoinRequests,
              requests: (prev?.getGroupJoinRequests?.requests || []).filter(
                (req: GroupJoinRequestType) =>
                  req._id.toString() !== variables.requestId.toString()
              ),
            },
          };
        });

        updateJoinRequestsCountQuery((prev) => ({
          ...prev!,
          joinRequestsCount: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(prev as any)!.joinRequestsCount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            count: ((prev as any)!.joinRequestsCount?.count || 0) - 1,
          },
        }));

        toast.success(
          data?.handleGroupRequest?.message ||
            `${
              variables.acception
                ? "request accepted successfully"
                : "request denied successfully"
            }`
        );
      },

      onError({ graphQLErrors }, options) {
        const acception = options?.variables?.handleGroupRequestData?.acception;

        toast.error(
          graphQLErrors?.[0]?.message ||
            `something went wrong while ${
              acception ? "accepting" : "decline"
            } the join request`
        );
      },
    });

  const requests = data?.getGroupJoinRequests?.requests;
  const isFinalPage = data?.getGroupJoinRequests?.isFinalPage;

  const handleFetchMore = () => {
    if (isFinalPage || loading || fetchMoreLoading || error) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: {
        requestsPaginationInfo: {
          groupId,
          ...pageAndLimit.current,
        },
      },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          getGroupJoinRequests: {
            requests: [
              ...requests,
              ...(fetchMoreResult?.getGroupJoinRequests?.requests || []),
            ],
            isFinalPage: !!fetchMoreResult?.getGroupJoinRequests?.isFinalPage,
          },
        };
      },
    });
  };

  if (loading) {
    return (
      <Wrapper>
        <Loading />
      </Wrapper>
    );
  }

  if (error && !loading && !requests?.length) {
    return (
      <Wrapper>
        <IllustrationPage
          content="can't get join request at the momment"
          svg={_404}
          btn={{ type: "custom", component: <></> }}
        />
      </Wrapper>
    );
  }

  if (!error && !loading && !requests?.length) {
    return (
      <Wrapper>
        <IllustrationPage
          content="there is no join request."
          svg={requestSVG}
          btn={{ type: "custom", component: <></> }}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper
      props={{
        onScroll: (e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          const isBottom = scrollTop + clientHeight >= scrollHeight;

          if (isBottom) handleFetchMore();
        },
      }}
    >
      <ul className="space-y-2">
        {requests.map(({ _id, user }: GroupJoinRequestType) => (
          <UserCard
            key={_id}
            btnType="CUSTOM"
            cardMode="ROW"
            customCardBtn={({ btnStyle }) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  title="accept join group request"
                  className={btnStyle}
                  disabled={handleJoinRequestLoading}
                  onClick={() =>
                    handleJoinRequest({
                      variables: {
                        handleGroupRequestData: {
                          groupId,
                          requestId: _id,
                          acception: true,
                          senderId: user._id,
                        },
                      },
                    })
                  }
                >
                  <FaCheckCircle size={18} />
                  Accept
                </Button>
                <Button
                  title="cancel join group request"
                  className={classNames(btnStyle, "red-btn")}
                  disabled={handleJoinRequestLoading}
                  onClick={() =>
                    handleJoinRequest({
                      variables: {
                        handleGroupRequestData: {
                          groupId,
                          requestId: _id,
                          acception: false,
                          senderId: user._id,
                        },
                      },
                    })
                  }
                >
                  <FaTimesCircle size={18} />
                  Decline
                </Button>
              </div>
            )}
            user={user}
          />
        ))}
      </ul>

      {!isFinalPage && (
        <Button
          title="get more join requests"
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
    </Wrapper>
  );
};

const GroupJoinRequestsList = () => {
  const groupId = (useParams()?.groupId || "") as string;

  const { data, loading, error, updateQuery } = useQuery(
    GET_JOIN_REQUESTS_COUNT,
    {
      variables: { groupId },
    }
  );

  const count = data?.joinRequestsCount?.count || 0;

  return (
    <Dialog>
      <Button asChild>
        <DialogTrigger
          title="show goup join requests"
          className="flex-wrap justify-center gap-2.5"
        >
          <FaEnvelope size={18} /> join requests
          {((!error && count) || loading) && (
            <div className="text-primary shadow-md grid place-content-center bg-white rounded-full w-[20px] h-[20px] relative">
              {loading && (
                <Loading size={14} fill="primary" withFullHeight={false} />
              )}
              {!loading && (count > 9 ? "+9" : count)}
            </div>
          )}
        </DialogTrigger>
      </Button>
      <JoinRequestsListContent updateJoinRequestsCountQuery={updateQuery} />
    </Dialog>
  );
};
export default GroupJoinRequestsList;
