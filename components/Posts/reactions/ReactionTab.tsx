// nextjs
import Link from "next/link";
import Image from "next/image";

// react
import { useEffect, useRef, useState } from "react";

// gql
import { gql, useLazyQuery } from "@apollo/client";

// components
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";

// shadcn
import { Button } from "@/components/ui/button";

// types
import type { NotFullUserType, ReactionsType } from "@/lib/types";

// icons
import { FaUser } from "react-icons/fa";
import { FaArrowRotateLeft } from "react-icons/fa6";

// SVGs
import _404SVG from "/public/illustrations/404-laptop.svg";
import searchSVG from "/public/illustrations/search.svg";

type Props = {
  itemId: string;
  reaction: keyof ReactionsType;
  activeReaction: keyof ReactionsType;
  type: "post" | "comment";
};

const ReactionTab = ({ itemId, reaction, activeReaction, type }: Props) => {
  const queryName = `get${type[0].toUpperCase()}${type.slice(1)}Reactions`;

  const GET_ITEM_SINGLE_REACTION = gql`
    query GetReactions($reactionsInfo: GetItemReactionsInput!) {
      ${queryName}(reactionsInfo: $reactionsInfo) {
        isFinalPage
        reactions {
          _id
          username
          profilePicture {
            secure_url
          }
        }
      }
    }
  `;

  const [initFetch, setInitFetch] = useState(false);
  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
  const pageAndLimit = useRef({
    page: 1,
    limit: 2,
  });

  const queryVariables = () => ({
    reactionsInfo: {
      itemId,
      reaction,
      ...pageAndLimit.current,
    },
  });

  const [getReactionUsers, { loading, data, error, fetchMore }] = useLazyQuery(
    GET_ITEM_SINGLE_REACTION,
    {
      variables: queryVariables(),
      onCompleted() {
        if (!initFetch) setInitFetch(true);
      },
    }
  );

  const reactions = (data?.[queryName]?.reactions || []) as NotFullUserType[];

  const isFinalPage = data?.[queryName]?.isFinalPage;

  useEffect(() => {
    if (!initFetch && activeReaction === reaction) getReactionUsers();
  }, [activeReaction]);

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

  const handleFetchMore = () => {
    if (fetchMoreLoading || loading || isFinalPage || error) return;

    pageAndLimit.current.page += 1;

    setFetchMoreLoading(true);
    fetchMore({
      variables: queryVariables(),

      updateQuery(_, { fetchMoreResult }) {
        setFetchMoreLoading(false);
        if (!fetchMoreResult) return data;

        return {
          [queryName]: {
            reactions: [
              ...reactions,
              ...(fetchMoreResult?.[queryName]?.reactions || []),
            ],
            isFinalPage: !!fetchMoreResult?.[queryName]?.isFinalPage,
          },
        };
      },
    });
  };

  if (activeReaction !== reaction) return;
  if (loading) return <Loading />;
  if (!loading && error && !reactions.length) {
    return (
      <IllustrationPage
        content={`can't get ${reaction} users of this ${type}`}
        svg={_404SVG}
        btn={{
          type: "custom",
          component: (
            <Button
              className="mx-auto"
              onClick={() => window.location.reload()}
            >
              <FaArrowRotateLeft />
              refresh page
            </Button>
          ),
        }}
      />
    );
  }
  if (!reactions.length && !loading && !error) {
    return (
      <IllustrationPage
        content={`this ${type} doesn't have users react with this reaction`}
        btn={{ type: "custom", component: <></> }}
        svg={searchSVG}
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {reactions.map(({ _id, username, profilePicture }, i) => (
          <li key={_id}>
            <Link
              href={`/user/${_id}`}
              className="flex items-center gap-1.5 flex-wrap hover:underline w-fit"
            >
              {profilePicture?.secure_url ? (
                <Image
                  alt={`user profile picture No. ${i + 1}`}
                  src={profilePicture.secure_url}
                  width={70}
                  height={70}
                  className="aspect-[1] object-contain rounded-sm"
                />
              ) : (
                <div className="w-[70px] h-[70px] rounded-sm bg-primary grid place-content-center">
                  <FaUser size={20} className="fill-white" />
                </div>
              )}

              <b className="text-black">{username}</b>
            </Link>
          </li>
        ))}
      </ul>

      {!isFinalPage && (
        <Button
          disabled={loading || fetchMoreLoading}
          onClick={handleFetchMore}
        >
          See More
        </Button>
      )}
    </>
  );
};

export default ReactionTab;
