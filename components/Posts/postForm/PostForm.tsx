"use client";

// next
import { useParams, useRouter } from "next/navigation";

// react
import {
  useState,
  useEffect,
  useRef,
  useContext,
  memo,

  // types
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
} from "react";

// contexts
import { PostsContext } from "@/contexts/PostsContext";

// components
import FormMediaPreview, {
  type FormMediaPreviewRefType,
} from "../FormMediaPreview";

import Radio_DropDownMenu, {
  type Radio_DropDownMenuRefType,
} from "@/components/Radio_DropDownMenu";

// shadcn
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// icons
import { AiFillPlusCircle } from "react-icons/ai";
import { BiSolidImageAdd } from "react-icons/bi";
import { FaCheck } from "react-icons/fa";

// gql
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// utils
import { uploadMedia } from "@/lib/utils";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import classNames from "classnames";

// types
import type { GroupType, PageType, PostType } from "@/lib/types";

type HomePageType =
  | {
      homePage: true;
      skipCount?: never;
      fetchMoreLoading?: never;
      setStopFetchMore?: never;
    }
  | {
      homePage: false;
      skipCount: MutableRefObject<number>;
      fetchMoreLoading: boolean;
      setStopFetchMore: Dispatch<SetStateAction<boolean>>;
    };

type ProfileType =
  | { profileType: "personal"; profileInfo?: never }
  | { profileType: "page"; profileInfo: PageType }
  | { profileType: "group"; profileInfo: GroupType };

type Props =
  | ({
      mode: "new";
      oldPostInfo?: never;
    } & ProfileType &
      HomePageType)
  | {
      profileInfo?: never;
      profileType?: never;
      mode: "edit";
      skipCount?: never;
      fetchMoreLoading?: never;
      setStopFetchMore?: never;
      homePage?: never;

      oldPostInfo: Pick<
        ReturnType<typeof useLazyQuery>[1],
        "loading" | "data" | "error" | "client"
      >;
    };

type RequiredNewPostDataType = Pick<
  PostType,
  "blockComments" | "caption" | "privacy" | "community"
> & {
  media: NonNullable<PostType["media"]>;
  communityId?: string;
};

const ADD_POST = gql`
  mutation AddPost($postData: PostDataInput!) {
    addPost(postData: $postData) {
      _id
      blockComments
      caption
      commentsCount
      isShared
      isInBookMark
      community

      owner {
        _id
        username
        profilePicture {
          secure_url
          public_id
        }
      }

      shareDate
      privacy
      media {
        public_id
        secure_url
      }

      shareData {
        count
      }

      reactions {
        angry {
          count
        }

        like {
          count
        }
        sad {
          count
        }
        love {
          count
        }
      }
    }
  }
`;

const EDIT_POST = gql`
  mutation EditPost($newPostData: EditPostDataInput!) {
    editPost(newPostData: $newPostData) {
      message
    }
  }
`;

const PostForm = ({
  skipCount,
  mode,
  oldPostInfo,
  fetchMoreLoading,
  setStopFetchMore,
  homePage,
  profileType,
  profileInfo,
}: Props) => {
  const router = useRouter();
  const pageId = (useParams()?.pageId || "") as string;
  const groupId = (useParams()?.groupId || "") as string;

  const { setData } = useContext(PostsContext);

  const [uploadingMedia, setUploadingMedia] = useState(false);

  const formMediaPreviewRef = useRef<FormMediaPreviewRefType>(null);
  const privacyListRef = useRef<Radio_DropDownMenuRefType>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isAddPost = useRef<boolean>(false);

  const oldPost = (oldPostInfo?.data as { getSinglePost: PostType })
    ?.getSinglePost;

  const [uploadPostMutation, { loading }] = useMutation(
    mode === "edit" ? EDIT_POST : ADD_POST,
    {
      onCompleted(data, options) {
        if (mode === "edit") {
          setData((prev) => {
            const newValues = options?.variables?.newPostData;

            return {
              ...prev,
              posts: prev.posts.map((post) => {
                if (post._id.toString() === oldPost._id.toString()) {
                  return {
                    ...post,
                    ...newValues,
                    media: [...(post?.media || []), ...(newValues.media || [])],
                  };
                }

                return post;
              }),
            };
          });

          router.push(
            oldPost.community === "personal"
              ? "/user/profile"
              : `/${oldPost.community}s/${oldPost.communityId?.toString()}`
          );

          toast.success(`post updated successfully`, { duration: 7500 });

          return;
        }

        if (data.addPost) {
          setData((prev) => {
            const newPost = data.addPost;

            if (data.addPost.community !== "personal") {
              newPost.communityInfo = {
                _id: profileInfo?._id,
                name: profileInfo?.name,
                profilePicture: profileInfo?.profilePicture,
              };
            }

            return {
              isFinalPage: !prev.posts.length ? true : prev.isFinalPage,
              posts: [newPost, ...prev.posts],
            };
          });

          if (!homePage) {
            setStopFetchMore(() => {
              skipCount.current += 1;
              return false;
            });
          }
        }

        toast.success(
          `post created successfully${
            !data.addPost ? " , refresh page to see it" : ""
          }`,
          {
            duration: 7500,
          }
        );
      },
      onError({ graphQLErrors }) {
        setStopFetchMore?.(false);

        toast.error(
          graphQLErrors?.[0].message ||
            `can't ${
              mode === "edit" ? "update" : "create"
            } your post at the momment, try again later`
        );
      },
    }
  );

  const handleSubmit = async () => {
    if (loading) return;

    const form = formRef.current as HTMLFormElement;

    const media = formMediaPreviewRef.current?.media || [];

    const uploadMediaFunc = async () => {
      try {
        setUploadingMedia(true);

        const mediaArr = await uploadMedia(media.map(({ file }) => file));

        return mediaArr;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        toast.error("can't upload post media at the momment", {
          duration: 7500,
        });
        return;
      } finally {
        setUploadingMedia(false);
      }
    };

    const caption = form.caption.value;

    const privacy =
      (privacyListRef.current?.selected as PostType["privacy"]) || "public";

    const blockComments = form.blockComments?.checked || false;

    if (mode === "new") {
      const postData: RequiredNewPostDataType = {
        blockComments,
        caption,
        media: [],
        privacy,
        community: profileType || "personal",
      };
      if (profileType === "page") postData.communityId = pageId;
      if (profileType === "group") postData.communityId = groupId;

      if (!caption && !media.length) {
        toast.error("post must have at least caption or one media", {
          duration: 7500,
        });
        return;
      }

      if (media.length) {
        const uploadedMedia = await uploadMediaFunc();

        postData.media.push(...uploadedMedia);
      }

      try {
        await uploadPostMutation({
          variables: { postData },
        });

        form.reset();

        if (media.length) formMediaPreviewRef.current?.setMedia([]);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {}

      return;
    }

    if (mode === "edit") {
      const newPostData: Partial<RequiredNewPostDataType> = {};

      const compareValues = [
        {
          old: oldPost.privacy,
          new: privacy,
          name: "privacy",
        },
        {
          old: oldPost.caption,
          new: caption,
          name: "caption",
        },
        {
          old: oldPost.blockComments,
          new: blockComments,
          name: "blockComments",
        },
      ];

      if (
        compareValues.every(({ old, new: newVal }) => old === newVal) &&
        !media.length
      ) {
        return toast.error("you can't submit same info for the post", {
          duration: 7000,
        });
      }

      compareValues
        .filter(({ old, new: newVal }) => old !== newVal)
        .forEach(({ name, new: newVal }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newPostData[name as keyof typeof newPostData] = newVal as any;
        });

      if (media.length) {
        const uploadedMedia = await uploadMediaFunc();

        newPostData.media = uploadedMedia;
      }

      await uploadPostMutation({
        variables: { newPostData: { ...newPostData, postId: oldPost._id } },
      });
    }
  };

  useEffect(() => {
    if (mode === "edit" && oldPost?.media?.length)
      formMediaPreviewRef.current?.setOldMedia(oldPost.media);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fetchMoreLoading && isAddPost.current && mode === "new") {
      if (!homePage) setStopFetchMore(true);
      handleSubmit();
      isAddPost.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMoreLoading]);

  const submitBtnContent = mode === "edit" ? "Changes" : "Post";

  const mediaPreviewerProps =
    mode === "new"
      ? { mode }
      : {
          mode,
          itemId: oldPost?._id || "",
        };

  return (
    <form
      ref={formRef}
      className="space-y-2.5 p-2 border border-primary rounded-sm"
      onSubmit={(e) => {
        e.preventDefault();

        if (mode === "new") {
          if (!fetchMoreLoading) {
            if (!homePage) setStopFetchMore(true);
            handleSubmit();
          } else isAddPost.current = true;

          return;
        }

        handleSubmit();
      }}
    >
      <Textarea
        name="caption"
        placeholder="Caption..."
        disabled={loading || uploadingMedia}
        defaultValue={oldPost?.caption || ""}
      />

      {((mode === "edit" && oldPost.community === "personal") ||
        (mode === "new" && profileType === "personal")) && (
        <Radio_DropDownMenu
          ref={privacyListRef}
          label="privacy"
          options={["only_me", "friends_only", "public"].map((option) => ({
            text: option.replace("_", " "),
            id: nanoid(),
            option,
            defaultSelected:
              mode === "edit"
                ? option === oldPost.privacy
                : option === "public",
          }))}
        />
      )}

      <input
        type="checkbox"
        id="blockComments"
        className="hidden"
        name="blockComments"
        disabled={loading || uploadingMedia}
        defaultChecked={!!(mode === "edit" && oldPost.blockComments)}
      />
      <label
        htmlFor="blockComments"
        className="flex items-center justify-start gap-1.5 text-primary w-fit"
      >
        <div className="bg-opacity-20 w-5 h-5 bg-primary rounded-sm border border-secondary grid place-content-center">
          <FaCheck
            fill="rgb(139, 8, 183)"
            size={12}
            className="transition duration-300 scale-0"
          />
        </div>

        <p>block comments</p>
      </label>

      <FormMediaPreview
        ref={formMediaPreviewRef}
        disableBtns={loading || uploadingMedia}
        {...mediaPreviewerProps}
        type="post"
      />

      <div className="flex gap-2 [&>*]:flex-1 flex-wrap">
        <input
          disabled={loading || uploadingMedia}
          type="file"
          className="hidden"
          id="add-media-to-post"
          multiple
          accept="image/*"
          name="media"
          onChange={(e) => {
            const media = e?.target?.files;
            if (media?.length) {
              formMediaPreviewRef.current?.setMedia((prev) => [
                ...prev,
                ...Array.from(media).map((file) => ({ file, id: nanoid() })),
              ]);
            }
          }}
        />
        <Button asChild>
          <label
            htmlFor="add-media-to-post"
            className={classNames(
              loading || uploadingMedia
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            )}
          >
            <BiSolidImageAdd size={20} />
            Add Media
          </label>
        </Button>

        <Button disabled={loading || uploadingMedia}>
          <AiFillPlusCircle size={20} />
          {loading || uploadingMedia
            ? "Loading..."
            : `Submit ${submitBtnContent}`}
        </Button>
      </div>
    </form>
  );
};

export default memo(PostForm);
