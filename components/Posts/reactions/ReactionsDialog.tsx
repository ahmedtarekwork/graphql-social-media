// react
import { useState } from "react";

// components
import ReactionTab from "./ReactionTab";

// shadcn
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// types
import type { ReactionsType } from "@/lib/types";

// constants
import { flatReactions, reactionsInfo } from "@/constants/reactions";

// utils
import classNames from "classnames";
import { abbreviateNumber } from "js-abbreviation-number";

type Props = {
  itemId: string;
  reactionsCount: ReactionsType;
  type: "post" | "comment";
};

const ReactionsDialog = ({ itemId, reactionsCount, type }: Props) => {
  const [activeReaction, setActiveReaction] =
    useState<keyof ReactionsType>("like");

  const reactions = reactionsInfo.map((reaction) => ({
    ...reaction,
    count:
      Object.entries(reactionsCount).find(([key]) => key === reaction.name)?.[1]
        ?.count || 0,
  }));

  return (
    <Dialog>
      <DialogTrigger>
        <ul className="p-1 flex items-center gap-2 bg-accent rounded-full shadow-sm border border-primary border-opacity-40 transition duration-200 hover:border-opacity-100">
          {reactions.map(({ Icon, count, name, color }) => {
            return (
              <li key={name} className="flex items-center gap-0.5">
                <Icon className={classNames(`fill-${color}`)} size={16} />
                <p className={classNames(`text-${color}`)}>
                  {abbreviateNumber(count)}
                </p>
              </li>
            );
          })}
        </ul>
      </DialogTrigger>

      <DialogContent aria-describedby="content">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>reactions list</DialogTitle>

            <DialogDescription>
              this dialog for render reactions list
            </DialogDescription>
          </VisuallyHidden>

          <ul className="flex items-center gap-1.5 relative border-b-2 border-b-primary pb-1">
            {reactions.map(({ name, Icon, count, color, rgbColor }) => {
              return (
                <li key={name}>
                  <Button
                    title={`see ${name} reactions`}
                    variant="ghost"
                    className={classNames(
                      `border-b-2 hover:!bg-opacity-20`,
                      name === activeReaction
                        ? `border-b-${color} bg-${color} bg-opacity-10`
                        : "border-b-transparent"
                    )}
                    onClick={() =>
                      setActiveReaction(name as keyof ReactionsType)
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = rgbColor(0.2))
                    }
                    onMouseLeave={(e) =>
                      e.currentTarget.style.removeProperty("background-color")
                    }
                  >
                    <Icon className={classNames(`fill-${color}`)} size={25} />

                    <p className={classNames(`text-${color}`)}>
                      {abbreviateNumber(count)}
                    </p>
                  </Button>
                </li>
              );
            })}
          </ul>

          {flatReactions.map((reaction) => (
            <ReactionTab
              type={type}
              key={reaction}
              itemId={itemId}
              reaction={reaction as keyof ReactionsType}
              activeReaction={activeReaction}
            />
          ))}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
export default ReactionsDialog;
