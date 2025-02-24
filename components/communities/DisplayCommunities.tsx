// nextjs
import Link from "next/link";

// react
import {
  useEffect,
  useRef,
  useState,

  // types
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

// gql
import { gql, useQuery } from "@apollo/client";

// shadcn
import { Button } from "@/components/ui/button";
// components
import Loading from "@/components/Loading";
import CommunityCard from "@/components/communities/CommunityCard";

import IllustrationPage, {
  type IllustrationPageBtnType,
} from "@/components/IllustrationPage";

// types
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import type { CommunitiesType, GroupType, PageType } from "@/lib/types";

// SVGs
import errorLaptopSVG from "/public/illustrations/error-laptop.svg";
import adminSVG from "/public/illustrations/Admin.svg";
import followSVG from "/public/illustrations/Follow.svg";
import ownedSVG from "/public/illustrations/My password.svg";
import exploreSVG from "/public/illustrations/plane.svg";

// icons
import { MdExplore, MdFiberNew } from "react-icons/md";

type Props = {
  CommunitiesType: CommunitiesType;
  setCommunitiesType: Dispatch<SetStateAction<CommunitiesType>>;
  mode: "page" | "group";
};

const DisplayCommunities = ({
  CommunitiesType,
  setCommunitiesType,
  mode,
}: Props) => {
  const pluralCommunityName = `${mode}s`;
  const queryName = `get${CommunitiesType[0].toUpperCase()}${CommunitiesType.slice(
    1
  )}${pluralCommunityName[0].toUpperCase()}${pluralCommunityName.slice(1)}`;

  const GET_COMMUNITIES = gql`
    query ${queryName}($pagination: PaginatedItemsInput!) {
      ${queryName}(pagination : $pagination) {
        isFinalPage
        ${mode}s {
          _id
          name
          profilePicture {
            secure_url
            public_id
          }
          ${mode === "page" ? "followersCount" : "membersCount"}
        }
      }
    }
  `;

  const pageAndLimit = useRef({ page: 1, limit: 2 });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { data, loading, error, fetchMore } = useQuery(GET_COMMUNITIES, {
    variables: { pagination: pageAndLimit.current },
  });

  const communities = (data?.[queryName]?.[pluralCommunityName] || []) as (
    | PageType
    | GroupType
  )[];
  const isFinalPage = !!data?.[queryName]?.isFinalPage;

  const handleFetchMore = () => {
    if (fetchMoreLoading || loading || isFinalPage || error) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: {
        pagination: pageAndLimit.current,
      },

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          [queryName]: {
            [pluralCommunityName]: [
              ...communities,
              ...(fetchMoreResult?.[queryName]?.[pluralCommunityName] || []),
            ],
            isFinalPage: !!fetchMoreResult?.[queryName]?.isFinalPage,
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

      if (isBottom) handleFetchMore();
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  if (error && !loading && !communities.length) {
    return (
      <IllustrationPage
        content={`cant get ${
          CommunitiesType === "explore" ? "" : `${CommunitiesType} `
        }${pluralCommunityName} at the momment`}
        svg={errorLaptopSVG}
        btn={{ type: "go-to-home" }}
      />
    );
  }

  if (!error && !loading && !communities.length) {
    let message: ReactNode;
    let SVG: StaticImport;
    let btn: IllustrationPageBtnType;

    switch (CommunitiesType) {
      case "admin": {
        message = `you are not admin in any ${pluralCommunityName}`;
        SVG = adminSVG;
        btn = { type: "go-to-home" };
        break;
      }
      case "owned": {
        message = `you are not owner of any ${pluralCommunityName}`;
        SVG = ownedSVG;
        btn = {
          type: "custom",
          component: (
            <Button asChild className="flex w-fit mx-auto">
              <Link href={`/${pluralCommunityName}/new`}>
                <MdFiberNew />
                create a {mode}
              </Link>
            </Button>
          ),
        };
        break;
      }
      case "joined":
      case "followed": {
        message = `you don't ${CommunitiesType} any ${pluralCommunityName}`;
        SVG = followSVG;
        btn = {
          type: "custom",
          component: (
            <Button
              className="mx-auto"
              onClick={() => setCommunitiesType("explore")}
            >
              <MdExplore />
              explore {pluralCommunityName}
            </Button>
          ),
        };
        break;
      }
      case "explore": {
        message = `there aren't any ${pluralCommunityName} to explore at the momment`;
        SVG = exploreSVG;
        btn = { type: "go-to-home" };
        break;
      }
    }

    return <IllustrationPage content={message} svg={SVG} btn={btn} />;
  }

  return (
    <>
      <ul
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 0.9fr))",
        }}
      >
        {communities.map((page) => (
          <CommunityCard key={page._id} community={page} type={mode} />
        ))}
      </ul>

      {!isFinalPage && (
        <Button
          disabled={loading || fetchMoreLoading}
          onClick={handleFetchMore}
        >
          {fetchMoreLoading || loading ? "Loading..." : "See More"}
        </Button>
      )}

      {fetchMoreLoading && (
        <Loading size={16} withText withFullHeight={false} />
      )}
    </>
  );
};
export default DisplayCommunities;
