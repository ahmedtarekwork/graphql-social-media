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
import CommunityCard from "@/components/CommunityCard";

import IllustrationPage, {
  type IllustrationPageBtnType,
} from "@/components/IllustrationPage";

// types
import { type PagesType } from "../page";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import type { PageType } from "@/lib/types";

// SVGs
import errorLaptopSVG from "/public/illustrations/error-laptop.svg";
import adminSVG from "/public/illustrations/Admin.svg";
import followSVG from "/public/illustrations/Follow.svg";
import ownedSVG from "/public/illustrations/My password.svg";
import exploreSVG from "/public/illustrations/plane.svg";

// icons
import { MdExplore, MdFiberNew } from "react-icons/md";

type Props = {
  pagesType: PagesType;
  setPagesType: Dispatch<SetStateAction<PagesType>>;
};

const DisplayPages = ({ pagesType, setPagesType }: Props) => {
  const queryName = `get${pagesType[0].toUpperCase()}${pagesType.slice(
    1
  )}Pages`;

  const GET_PAGES = gql`
    query ${queryName}($pagination: PaginatedItemsInput!) {
      ${queryName}(pagination : $pagination) {
        isFinalPage
        pages {
          _id
          name
          profilePicture {
            secure_url
            public_id
          }
          followersCount
        }
      }
    }
  `;

  const pageAndLimit = useRef({ page: 1, limit: 2 });

  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  const { data, loading, error, fetchMore } = useQuery(GET_PAGES, {
    variables: { pagination: pageAndLimit.current },
  });

  const pages = (data?.[queryName]?.pages || []) as PageType[];
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
            pages: [...pages, ...(fetchMoreResult?.[queryName]?.pages || [])],
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

  if (error && !loading && !pages.length) {
    return (
      <IllustrationPage
        content={`cant get ${
          pagesType === "explore" ? "" : `${pagesType} `
        }pages at the momment`}
        svg={errorLaptopSVG}
        btn={{ type: "go-to-home" }}
      />
    );
  }

  if (!error && !loading && !pages.length) {
    let message: ReactNode;
    let SVG: StaticImport;
    let btn: IllustrationPageBtnType;

    switch (pagesType) {
      case "admin": {
        message = "you are not admin in any pages";
        SVG = adminSVG;
        btn = { type: "go-to-home" };
        break;
      }
      case "owned": {
        message = "you are not owner of any pages";
        SVG = ownedSVG;
        btn = {
          type: "custom",
          component: (
            <Button asChild>
              <Link href="/pages/new">
                <MdFiberNew />
                create a page
              </Link>
            </Button>
          ),
        };
        break;
      }
      case "followed": {
        message = "you don't follow any pages";
        SVG = followSVG;
        btn = {
          type: "custom",
          component: (
            <Button onClick={() => setPagesType("explore")}>
              <MdExplore />
              explore pages
            </Button>
          ),
        };
        break;
      }
      case "explore": {
        message = "there aren't any pages to explore at the momment";
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
        {pages.map((page) => (
          <CommunityCard key={page._id} community={page} type="page" />
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
export default DisplayPages;
