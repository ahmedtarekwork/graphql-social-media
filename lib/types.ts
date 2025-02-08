import { Types } from "mongoose";

import type { NextRequest } from "next/server";

export type PostsResponse = { posts: PostType[]; isFinalPage: boolean };

export type NotFullUserType = Pick<UserType, "_id" | "username"> & {
  profilePicture: Pick<ImageType, "secure_url"> | null;
};

export type NotificationType = {
  _id: string;
  content: string;
  icon:
    | "friend"
    | "page"
    | "group"
    | "post"
    | "comment"
    | "sad"
    | "angry"
    | "love"
    | "like"
    | "not_specified";
  url: string;
  createdAt: string;
  hasRead: boolean;
};

export type UserType = Record<
  "email" | "username" | "address" | "_id",
  string
> &
  Record<
    "followedPages" | "ownedPages" | "adminPages",
    Pick<PageType, "_id" | "name" | "profilePicture">[]
  > &
  Record<
    "joinedGroups" | "adminGroups" | "ownedGroups",
    Pick<GroupType, "_id" | "name" | "profilePicture">[]
  > &
  Record<"profilePicture" | "coverPicture", ImageType | null> & {};
export type ReqUserType = Omit<UserType, "_id"> & { password: string };

export type StoryType = {
  _id: string;
  owner: UserType;
  media: ImageType | null;
  caption: string | null;
  reactions: ReactionsType;
  createdAt: string;
  expiredData: number;
};

export type PageType = {
  _id: string;
  name: string;
  owner: UserType;
  admins: UserType[];
  followersCount: number;
  profilePicture: ImageType | null;
  coverPicture: ImageType | null;
};
export type GroupType = {
  _id: string;
  name: string;
  privacy: "public" | "members_only";
  profilePicture: ImageType | null;
  coverPicture: ImageType | null;
  membersCount: number;
  owner: UserType;
  admins: UserType[];
  joinRequests: {
    _id: string; // id of the request
    user: UserType;
  }[];
};

export type PostType = CommentAndPostSharedProps & {
  isInBookMark: boolean;
  caption?: string;
  commentsCount: number;
  blockComments: boolean;
  privacy: "public" | "only_me" | "friends_only";
  shareData: {
    count: number;
    users: Pick<UserType, "username" | "_id" | "profilePicture">[];
  };
  shareDate: string;
  isShared: boolean;
};

export type CommentType = CommentAndPostSharedProps & {
  comment?: string;
  post: string;
  createdAt: string;
};

type CommentAndPostSharedProps = {
  _id: string;
  owner: Pick<UserType, "_id" | "username" | "profilePicture">;
  media?: ImageType[];
  reactions: ReactionsType;
  community: "page" | "group" | "personal";
  communityId: typeof Types.ObjectId | null;
};

export type ReactionsType = Record<
  "like" | "love" | "sad" | "angry",
  { count: number }
>;

export type APIContextFnType = {
  req: NextRequest;
};
export type ImageType = Record<"public_id" | "secure_url", string>;

export type Pagination<
  T extends Record<string, unknown> | undefined = Record<string, unknown>
> = Record<"page" | "limit", number> & T;
