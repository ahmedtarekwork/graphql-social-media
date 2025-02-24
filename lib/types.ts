import { useQuery } from "@apollo/client";
import { Types } from "mongoose";

import type { NextRequest } from "next/server";

export type ReturnTypeOfUseQuery = ReturnType<typeof useQuery>;

export type PostsResponse = { posts: PostType[]; isFinalPage: boolean };

export type NotFullUserType = Pick<UserType, "_id" | "username"> & {
  profilePicture: Pick<ImageType, "secure_url"> | null;
};

export type CommunitiesType =
  | "owned"
  | "admin"
  | "followed"
  | "explore"
  | "joined";

export type GroupInputDataType = Pick<
  GroupType,
  "name" | "privacy" | "profilePicture" | "coverPicture"
>;

export type NotFullCommunity = NotFullPageOrPost &
  Partial<Pick<GroupType, "membersCount">> &
  Partial<Pick<PageType, "followersCount">>;

type NotFullPageOrPost = Pick<
  PageType | GroupType,
  "_id" | "name" | "profilePicture"
>;

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
  sharePerson?: NotFullUserType;
  communityInfo?: NotFullPageOrPost;
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
export type ImageType = Record<"public_id" | "secure_url" | "_id", string>;

export type Pagination<
  T extends Record<string, unknown> | undefined = Record<string, unknown>
> = Record<"page" | "limit", number> & T;
