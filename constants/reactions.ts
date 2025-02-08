// icons
import { AiFillLike } from "react-icons/ai";
import { FaHeart, FaSadTear } from "react-icons/fa";
import { PiSmileyAngryFill } from "react-icons/pi";

export const flatReactions = ["like", "love", "sad", "angry"];

export const reactionsInfo = [
  {
    name: "like",
    Icon: AiFillLike,
    color: "blue-700",
    rgbColor: (opacity: number = 1) => `rgba(51, 75, 229, ${opacity})`,
  },
  {
    name: "love",
    Icon: FaHeart,
    color: "red-700",
    rgbColor: (opacity: number = 1) => `rgba(201, 48, 48, ${opacity})`,
  },
  {
    name: "sad",
    Icon: FaSadTear,
    color: "yellow-700",
    rgbColor: (opacity: number = 1) => `rgba(219, 219, 48, ${opacity})`,
  },
  {
    name: "angry",
    Icon: PiSmileyAngryFill,
    color: "orange-700",
    rgbColor: (opacity: number = 1) => `rgba(232, 150, 34, ${opacity})`,
  },
];
