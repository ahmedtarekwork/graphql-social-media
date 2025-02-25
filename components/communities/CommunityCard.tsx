// nextjs
import Link from "next/link";

// components
import ImageWithLoading from "../ImageWithLoading";
// shadcn
import { Button } from "../ui/button";

// types
import type { NotFullCommunity } from "@/lib/types";

// icons
import { FaEye, FaFlag } from "react-icons/fa";
import { TiGroup } from "react-icons/ti";

type Props = {
  community: NotFullCommunity;
  type: "page" | "group";
};

const CommunityCard = ({ community, type }: Props) => {
  const { name, _id, profilePicture } = community;

  const Icon = type === "page" ? FaFlag : TiGroup;

  return (
    <li className="border-2 border-primary rounded-sm space-y-2 pb-2">
      <Link href={`/${type}s/${_id}`} className="peer block">
        {profilePicture?.secure_url ? (
          <ImageWithLoading
            alt={`${type} profile picture`}
            src={profilePicture.secure_url}
            width={180}
            height={180}
            className="aspect-[1] object-contain w-full"
          />
        ) : (
          <div className="bg-primary w-full aspect-[1] grid place-content-center">
            <Icon size={75} fill="white" />
          </div>
        )}
      </Link>

      <Link
        href={`${type}s/${_id}`}
        className="text-black truncate w-fit font-bold block hover:underline peer-hover:underline px-[2.5%]"
      >
        {name}
      </Link>

      <Button asChild className="w-[95%] mx-auto">
        <Link href={`${type}s/${_id}`}>
          <FaEye />
          View {type}
        </Link>
      </Button>
    </li>
  );
};
export default CommunityCard;
