// react
import { useRef } from "react";

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
};

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($reactionData: ToggleReactionInput!) {
    toggleReaction(reactionData: $reactionData) {
      message
    }
  }
`;

const GET_MY_REACTION = gql`
  query GetMyReactionToPost($postId: ID!) {
    getMyReactionToPost(postId: $postId) {
      reaction
    }
  }
`;

const ToggleReactionBtn = ({ itemId }: Props) => {
  const [toggleReaction, { loading }] = useMutation(TOGGLE_REACTION, {
    onCompleted(_, options) {
      updateQuery((prev) => {
        const newReaction = options?.variables?.reactionData.reaction;

        const isReactionRemoved = myReaction === newReaction;

        return {
          getMyReactionToPost: {
            ...prev.getMyReactionToPost,
            reaction: isReactionRemoved
              ? undefined
              : newReaction || prev.getMyReactionToPost.reaction,
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
    variables: { postId: itemId },
  });

  const myReaction = myReactionResponse?.getMyReactionToPost?.reaction;
  const reactionInfo = reactionsInfo.find(({ name }) => name === myReaction);
  const Icon = reactionInfo?.Icon || AiFillLike;

  const reactionsListRef = useRef<HTMLUListElement>(null);

  return (
    <div
      className="relative"
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
        variant="ghost"
        className={classNames(
          "font-semibold capitalize w-full",
          `text-${reactionInfo?.color || "gray-600"}`
        )}
        onClick={() =>
          toggleReaction({
            variables: {
              reactionData: { itemId, reaction: myReaction || "like" },
            },
          })
        }
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
        className="origin-bottom hide-reactions-list flex-wrap absolute bottom-[90%] left-0 shadow-sm flex gap-3.5 max-w-screen w-[270px] justify-between min-w-max bg-accent rounded-[100vh] p-3 transition duration-200 border-primary border border-opacity-60"
      >
        {reactionsInfo.map(({ name, Icon, color }) => (
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
              onClick={() => {
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
