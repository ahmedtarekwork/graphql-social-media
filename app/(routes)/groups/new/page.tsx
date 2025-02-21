"use client";

// nextjs
import Image from "next/image";
import { useRouter } from "next/navigation";

// react
import { FormEvent, useRef, useState } from "react";

// components
import Loading from "@/components/Loading";
import Radio_DropDownMenu, {
  Radio_DropDownMenuRefType,
} from "@/components/Radio_DropDownMenu";

// shadcn
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";

// icons
import { AiOutlineUserSwitch } from "react-icons/ai";
import { FaImage } from "react-icons/fa";

// utils
import classNames from "classnames";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/utils";
import { nanoid } from "nanoid";

// types
import type { GroupInputDataType, GroupType } from "@/lib/types";

// gql
import { gql, useMutation } from "@apollo/client";

const MAKE_NEW_GROUP = gql`
  mutation AddPage($groupData: AddGroupInput!) {
    addGroup(groupData: $groupData) {
      _id
    }
  }
`;

const NewGroupFormPage = () => {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const groupNameInputRef = useRef<HTMLInputElement>(null);
  const privacyOptionsListRef = useRef<Radio_DropDownMenuRefType>(null);

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [coverPicture, setCoverPicture] = useState<File | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [makeNewGroup, { loading }] = useMutation(MAKE_NEW_GROUP, {
    onCompleted(data) {
      toast.success("group created successfully", { duration: 7000 });

      const groupId = data?.addGroup?._id;
      if (groupId) router.push(`/groups/${groupId}`);
    },

    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't make this new group at the momment",
        { duration: 7000 }
      );
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (disableBtn) return;

    const form = formRef.current;
    const groupData: GroupInputDataType = {
      name: form?.["group-name"]?.value || "",
      profilePicture: null,
      coverPicture: null,
      privacy: (privacyOptionsListRef.current?.selected ||
        "public") as GroupType["privacy"],
    };

    if (!groupData.name) {
      toast.error("group must have a name", { duration: 7000 });
      groupNameInputRef.current?.classList.add(
        "!border-red-700",
        "placeholder:!text-red-700"
      );
      return;
    }

    const Imgs = [profilePicture, coverPicture];

    if (Imgs.length) {
      setUploadingMedia(true);

      try {
        const [profilePictureRes, coverPictureRes] = await Promise.allSettled(
          Imgs.map((img) => (!img ? [] : uploadMedia([img])))
        );

        if (profilePicture && profilePictureRes.status === "fulfilled")
          groupData.profilePicture = profilePictureRes.value[0];

        if (coverPicture && coverPictureRes.status === "fulfilled")
          groupData.coverPicture = coverPictureRes.value[0];
      } catch (_) {
        toast.error("something went wrong while uploading pictures");
        return;
      } finally {
        setUploadingMedia(false);
      }
    }

    await makeNewGroup({ variables: { groupData } });
    form?.reset();
    setProfilePicture(null);
    setCoverPicture(null);
  };

  const disableBtn = uploadingMedia || loading;

  return (
    <>
      <h1 className="font-bold text-primary underline underline-offset-8 text-2xl">
        Create a new Group
      </h1>

      <form ref={formRef} className="mt-3 space-y-3" onSubmit={handleSubmit}>
        <Input
          ref={groupNameInputRef}
          name="group-name"
          placeholder="group name..."
          disabled={disableBtn}
          className="transition duration-200"
        />

        <Radio_DropDownMenu
          ref={privacyOptionsListRef}
          label="group privacy"
          options={[
            {
              id: nanoid(),
              option: "public",
              text: "public",
              defaultSelected: true,
            },
            { id: nanoid(), option: "members_only", text: "members only" },
          ]}
        />

        <AnimatePresence>
          <motion.div layout className="flex gap-4 flex-wrap items-stretch">
            <motion.div
              layout
              className="flex-1 flex flex-col gap-2 p-2 bg-primary bg-opacity-30 rounded-sm"
            >
              {profilePicture && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, transformOrigin: "center" }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "tween" }}
                  className="mb-1 flex-1 grid place-content-center"
                >
                  <Image
                    src={URL.createObjectURL(profilePicture)}
                    alt="profile pricture"
                    priority={true}
                    width={200}
                    height={200}
                    className="object-contain aspect-[1] mx-auto"
                  />
                </motion.div>
              )}

              <motion.div layout="position" className="mt-auto">
                <Label
                  htmlFor="profile-picture"
                  className={classNames(
                    disableBtn
                      ? "opacity-20 cursor-not-allowed hover:!scale-100"
                      : "cursor-pointer",
                    profilePicture ? "active" : "",
                    "text-primary text-center font-semibold bg-white block rounded-sm shadow-md hover:scale-[1.025] choose-picture-label"
                  )}
                >
                  {profilePicture ? (
                    <AiOutlineUserSwitch size={30} className="mx-auto" />
                  ) : (
                    <FaImage size={30} className="mx-auto" />
                  )}
                  {profilePicture ? "change" : "add"} profile picture
                </Label>

                {profilePicture && (
                  <motion.div
                    initial={{ scaleX: 0, marginTop: 0 }}
                    animate={{ scaleX: 1, marginTop: 7 }}
                    exit={{ scaleX: 0, marginTop: 0 }}
                    transition={{
                      type: "tween",
                    }}
                  >
                    <Button
                      className="red-btn w-full"
                      onClick={() => setProfilePicture(null)}
                      disabled={disableBtn}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              <input
                accept="image/*"
                disabled={disableBtn}
                onChange={(e) => {
                  if (e.target.files?.[0]) setProfilePicture(e.target.files[0]);
                }}
                id="profile-picture"
                type="file"
                className="py-5 bg-white border-0 hidden"
              />
            </motion.div>

            <motion.div
              layout
              className="flex-1 flex flex-col gap-2 p-2 bg-primary bg-opacity-30 rounded-sm"
            >
              {coverPicture && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, transformOrigin: "center" }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "tween" }}
                  className="mb-1 flex-1 grid place-content-center"
                >
                  <Image
                    src={URL.createObjectURL(coverPicture)}
                    alt="cover pricture"
                    priority={true}
                    width={200}
                    height={200}
                    className="object-contain aspect-[1] mx-auto"
                  />
                </motion.div>
              )}

              <motion.div layout="position" className="mt-auto">
                <Label
                  htmlFor="cover-picture"
                  className={classNames(
                    disableBtn
                      ? "opacity-20 cursor-not-allowed hover:!scale-100"
                      : "cursor-pointer",
                    coverPicture ? "active" : "",
                    "text-primary text-center font-semibold bg-white block rounded-sm shadow-md hover:scale-[1.025] choose-picture-label"
                  )}
                >
                  {coverPicture ? (
                    <AiOutlineUserSwitch size={30} className="mx-auto" />
                  ) : (
                    <FaImage size={30} className="mx-auto" />
                  )}
                  {coverPicture ? "change" : "add"} cover picture
                </Label>

                {coverPicture && (
                  <motion.div
                    initial={{ scaleX: 0, marginTop: 0 }}
                    animate={{ scaleX: 1, marginTop: 7 }}
                    exit={{ scaleX: 0, marginTop: 0 }}
                    transition={{
                      type: "tween",
                    }}
                  >
                    <Button
                      disabled={disableBtn}
                      className="red-btn w-full"
                      onClick={() => setCoverPicture(null)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              <input
                accept="image/*"
                disabled={disableBtn}
                onChange={(e) => {
                  if (e.target.files?.[0]) setCoverPicture(e.target.files[0]);
                }}
                id="cover-picture"
                type="file"
                className="py-5 bg-white border-0 hidden"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <Button asChild>
          <motion.button
            className="w-full"
            disabled={disableBtn}
            layout="position"
          >
            {disableBtn ? (
              <Loading withText withFullHeight={false} fill="white" size={18} />
            ) : (
              "Submit"
            )}
          </motion.button>
        </Button>
      </form>
    </>
  );
};
export default NewGroupFormPage;
