// nextjs
import { useParams } from "next/navigation";

// react
import {
  useContext,
  useEffect,
  useRef,
  useState,

  // types
  type ReactNode,
  type UIEventHandler,
} from "react";

// components
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";
import UserCard from "@/components/UserCard";
import RemoveAdminBtn from "./RemoveAdminBtn";

// shadcn
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// gql
import { gql, useQuery } from "@apollo/client";

// SVGs
import laptopErrorSVG from "/public/illustrations/error-laptop.svg";
import emptySVG from "/public/illustrations/search.svg";

// types
import type { NotFullUserType } from "@/lib/types";
import { authContext } from "@/contexts/AuthContext";

type Props = {
  profileType: "page" | "group";
  isUserOwner: boolean;
};

const Wrapper = ({
  children,
  handleScroll = () => {},
}: {
  children: ReactNode;
  handleScroll?: UIEventHandler<HTMLDivElement>;
}) => (
  <DialogContent
    className="overflow-auto"
    aria-describedby="admins-list-dialog"
    onScroll={handleScroll}
  >
    <DialogHeader>
      <DialogTitle className="mb-2 underline underline-offset-[7px] text-primary capitalize">
        Admins List
      </DialogTitle>
      <VisuallyHidden>
        <DialogDescription>Admins List</DialogDescription>
      </VisuallyHidden>

      {children}
    </DialogHeader>
  </DialogContent>
);

const AdminsList = ({ profileType, isUserOwner }: Props) => {
  const { user } = useContext(authContext);

  const params = useParams();
  const queryName = `get${profileType[0].toUpperCase()}${profileType.slice(
    1
  )}AdminsList`;

  const GET_PAGE_ADMINS_LIST = gql`
    query Get${profileType[0].toUpperCase()}${profileType.slice(1)}AdminsList(
      $paginationData: ${
        profileType === "page"
          ? "PaginatedItemsInputWithIdAndSkip"
          : "PaginationWithSkipAndGroupId"
      }!
    ) {
      ${queryName}(paginationData: $paginationData) {
        isFinalPage
        admins {
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

  const pageAndLimit = useRef({ page: 1, limit: 2, skip: 0 });
  const isWaitForFetch = useRef(false);

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const [stopFetchMore, setStopFetchMore] = useState(false);

  const queryVariables = () => ({
    paginationData: {
      [`${profileType}Id`]: params?.[`${profileType}Id`] || "",
      ...pageAndLimit.current,
    },
  });

  const { data, loading, error, fetchMore, updateQuery } = useQuery(
    GET_PAGE_ADMINS_LIST,
    {
      variables: queryVariables(),
    }
  );

  const admins = (data?.[queryName]?.admins || []) as NotFullUserType[];
  const isFinalPage = data?.[queryName]?.isFinalPage;

  const handleFetchMore = () => {
    if (stopFetchMore) isWaitForFetch.current = true;

    if (fetchMoreLoading || loading || isFinalPage || error || stopFetchMore)
      return;

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
          [queryName]: {
            admins: [
              ...admins,
              ...(fetchMoreResult?.[queryName]?.admins || []),
            ],
            isFinalPage: !!fetchMoreResult?.[queryName]?.isFinalPage,
          },
        };
      },
    });
  };

  useEffect(() => {
    if (!stopFetchMore && isWaitForFetch) handleFetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopFetchMore]);

  if (loading) {
    return (
      <Wrapper>
        <Loading />
      </Wrapper>
    );
  }

  if (!loading && error && !admins.length) {
    return (
      <Wrapper>
        <IllustrationPage
          content={`can't get this ${profileType} admins list at the momment`}
          btn={{ type: "custom", component: <></> }}
          svg={laptopErrorSVG}
        />
      </Wrapper>
    );
  }

  if (!loading && !error && !admins.length) {
    return (
      <Wrapper>
        <IllustrationPage
          content={`this ${profileType} doesn't have any admins yet`}
          btn={{ type: "custom", component: <></> }}
          svg={emptySVG}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper
      handleScroll={(e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        const isBottom = scrollTop + clientHeight >= scrollHeight;

        if (isBottom) handleFetchMore();
      }}
    >
      <ul className="space-y-2">
        {admins
          .filter(({ _id }) => _id.toString() !== user?._id.toString())
          .map((user) => {
            return (
              <UserCard
                key={user._id}
                btnType="CUSTOM"
                cardMode="ROW"
                user={user}
                customCardBtn={({ btnStyle }) =>
                  isUserOwner ? (
                    <RemoveAdminBtn
                      profileType={profileType}
                      userId={user._id}
                      adminsListUpdateQuery={updateQuery}
                      btnStyle={btnStyle}
                      pageAndLimit={pageAndLimit}
                      fetchMoreLoading={fetchMoreLoading}
                      setStopFetchMore={setStopFetchMore}
                    />
                  ) : (
                    <></>
                  )
                }
              />
            );
          })}
      </ul>
      {!isFinalPage && (
        <Button onClick={handleFetchMore} disabled={loading}>
          See More
        </Button>
      )}
    </Wrapper>
  );
};
export default AdminsList;
