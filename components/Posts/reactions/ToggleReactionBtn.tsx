// react
import { createRef, useEffect, useRef } from "react";

// components
// shadcn
import { Button } from "../../ui/button";

// icons
import { AiFillLike } from "react-icons/ai";

// gql
import { gql, useMutation, useQuery } from "@apollo/client";

// utils
import classNames from "classnames";

// constants
import { reactionsInfo } from "@/constants/reactions";

type Props = {
  itemId: string;
  type: "post" | "comment";
};

const ToggleReactionBtn = ({ itemId, type }: Props) => {
  const getReactionQueryName = `getMyReactionTo${type[0].toUpperCase()}${type.slice(
    1
  )}`;

  const GET_MY_REACTION = gql`
    query GetMyReaction($itemId: ID!) {
      ${getReactionQueryName}(itemId: $itemId) {
        reaction
      }
    }
  `;

  const TOGGLE_REACTION = gql`
    mutation ToggleReaction($reactionData: ToggleReactionInput!) {
      toggleReaction${
        type === "comment" ? "OnComment" : ""
      }(reactionData: $reactionData) {
        message
      }
    }
  `;

  const [toggleReaction, { loading }] = useMutation(TOGGLE_REACTION, {
    onCompleted(_, options) {
      updateQuery((prev) => {
        const newReaction = options?.variables?.reactionData.reaction;

        const isReactionRemoved = myReaction === newReaction;

        return {
          [getReactionQueryName]: {
            ...prev?.[getReactionQueryName],
            reaction: isReactionRemoved
              ? undefined
              : newReaction || prev?.[getReactionQueryName].reaction,
          },
        };
      });
    },
  });

  const {
    data: myReactionResponse,
    updateQuery,
    loading: myReaectionLoading,
  } = useQuery(GET_MY_REACTION, {
    variables: { itemId },
  });

  const myReaction = myReactionResponse?.[getReactionQueryName]?.reaction;
  const reactionInfo = reactionsInfo.find(({ name }) => name === myReaction);
  const Icon = reactionInfo?.Icon || AiFillLike;
  let isTouchEvent = false;

  const reactionsListRef = useRef<HTMLUListElement>(null);
  const parentHolderRef = useRef<HTMLDivElement>(null);
  const outsideBtnRef = useRef<HTMLButtonElement>(null);
  const reactionsBtnsRefsList = useRef(
    reactionsInfo.map(({ name }) => ({
      name,
      ref: createRef<HTMLButtonElement>(),
    }))
  );

  useEffect(() => {
    const handleCloseReactionsList = (e: TouchEvent) => {
      if (
        [
          outsideBtnRef.current,
          parentHolderRef.current,
          ...reactionsBtnsRefsList.current.map(({ ref }) => ref.current),
        ].some((el) => (e.target as HTMLElement).isEqualNode(el))
      )
        return;

      if (isTouchEvent) {
        setTimeout(() => (isTouchEvent = false), 100);
      }

      reactionsListRef.current?.classList.add("hide-reactions-list");
    };

    window.addEventListener("touchstart", handleCloseReactionsList);

    () => {
      window.removeEventListener("touchstart", handleCloseReactionsList);
    };
  }, []);

  return (
    <div
      ref={parentHolderRef}
      className="relative"
      onTouchStart={() => {
        isTouchEvent = true;
        if (loading || myReaectionLoading) return;
        reactionsListRef.current?.classList.remove("hide-reactions-list");
      }}
      onMouseEnter={() => {
        if (loading || myReaectionLoading) return;
        reactionsListRef.current?.classList.remove("hide-reactions-list");
      }}
      onMouseLeave={() => {
        if (loading || myReaectionLoading) return;
        reactionsListRef.current?.classList.add("hide-reactions-list");
      }}
    >
      <Button
        ref={outsideBtnRef}
        variant={type === "post" ? "ghost" : "link"}
        className={classNames(
          "font-semibold capitalize w-full",
          `text-${reactionInfo?.color || "gray-600"}`
        )}
        onTouchStart={() => {
          isTouchEvent = true;
          if (loading || myReaectionLoading) return;
          reactionsListRef.current?.classList.remove("hide-reactions-list");
        }}
        onClick={(e) => {
          if (isTouchEvent) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          toggleReaction({
            variables: {
              reactionData: { itemId, reaction: myReaction || "like" },
            },
          });
        }}
        disabled={loading || myReaectionLoading}
      >
        <Icon
          size={20}
          className={classNames(`fill-${reactionInfo?.color || "gray-600"}`)}
        />
        {loading || myReaectionLoading
          ? "Loading..."
          : `${myReaction || "Like"}${
              ["love", "like"].includes(myReaction) ? "d" : ""
            }`}
      </Button>

      <ul
        ref={reactionsListRef}
        className={classNames(
          type === "comment" ? "origin-bottom-left" : "origin-bottom",
          "hide-reactions-list flex-wrap absolute bottom-[90%] left-0 shadow-sm flex gap-3.5 max-w-screen w-[270px] justify-between min-w-max bg-accent rounded-[100vh] p-3 transition duration-200 border-primary border border-opacity-60"
        )}
      >
        {reactionsInfo.map(({ name, Icon, color }, i) => (
          <li
            key={name}
            className={
              myReaction === name
                ? "flex flex-col items-center justify-center gap-1"
                : ""
            }
          >
            <button
              className="group"
              disabled={loading || myReaectionLoading}
              ref={
                reactionsBtnsRefsList.current.find(
                  ({ name: refName }) => refName === name
                )?.ref
              }
              onClick={(e) => {
                reactionsListRef.current?.classList.add("hide-reactions-list");

                toggleReaction({
                  variables: {
                    reactionData: { itemId, reaction: name },
                  },
                });
              }}
            >
              <Icon
                size={33}
                className={classNames(
                  `fill-${color}`,
                  "transition duration-200 group-hover:scale-125",
                  myReaction === name ? "scale-110" : ""
                )}
              />
            </button>

            {myReaction === name && (
              <div className="size-2 bg-primary rounded-full" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default ToggleReactionBtn;
