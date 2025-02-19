// nextjs
import { useParams } from "next/navigation";

// react
import {
  type ReactNode,
  type UIEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";

// components
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";
import UserCard from "@/components/UserCard";
import RemoveAdminBtn from "./RemoveAdminBtn";

// shadcn
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
import { Button } from "@/components/ui/button";

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
    aria-describedby="notifications-dialog"
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
  const pageId = (useParams()?.pageId || "") as string;

  const GET_PAGE_ADMINS_LIST = gql`
    query GetPageAdminsList(
      $paginationData: PaginatedItemsInputWithIdAndSkip!
    ) {
      getPageAdminsList(paginationData: $paginationData) {
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
      pageId,
      ...pageAndLimit.current,
    },
  });

  const { data, loading, error, fetchMore, updateQuery } = useQuery(
    GET_PAGE_ADMINS_LIST,
    {
      variables: queryVariables(),
    }
  );

  const admins = (data?.getPageAdminsList?.admins || []) as NotFullUserType[];
  const isFinalPage = data?.getPageAdminsList?.isFinalPage;

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
          getPageAdminsList: {
            admins: [
              ...admins,
              ...(fetchMoreResult?.getPageAdminsList?.admins || []),
            ],
            isFinalPage: !!fetchMoreResult?.getPageAdminsList?.isFinalPage,
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
        {admins.map((user) => {
          return (
            <UserCard
              key={user._id}
              btnType="CUSTOM"
              cardMode="ROW"
              user={user}
              customCardBtn={({ btnStyle }) =>
                isUserOwner ? (
                  <RemoveAdminBtn
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
