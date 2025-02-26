"use client";

// nextjs
import Link from "next/link";
import Image from "next/image";

// react
import { type FormEvent, useContext, useRef, useState } from "react";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// graphql
import { gql, useMutation } from "@apollo/client";

// context
import { authContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

// framer motion
import { AnimatePresence, motion } from "framer-motion";

// icons
import { MdPersonAddAlt1 } from "react-icons/md";
import { FaMountainSun } from "react-icons/fa6";
import { AiOutlineUserSwitch } from "react-icons/ai";

// utils
import { uploadMedia } from "@/lib/utils";
import classNames from "classnames";

const SignupPage = () => {
  const { setUser } = useContext(authContext);

  // refs
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const profilePictureRef = useRef<HTMLInputElement>(null);
  const coverPictureRef = useRef<HTMLInputElement>(null);

  // states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>();
  const [coverPicture, setCoverPicture] = useState<File | null>();
  const [uploading, setUploading] = useState(false);

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    email: "",
    address: "",
  });

  const requiredInputs = [
    {
      key: "username",
      value: username,
      ref: usernameRef,
    },
    {
      key: "password",
      value: password,
      ref: passwordRef,
    },
    {
      key: "email",
      value: email,
      ref: emailRef,
    },
    {
      key: "address",
      value: address,
      ref: addressRef,
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors = {} as typeof errors;

    requiredInputs.forEach(({ key, value, ref }) => {
      if (!value) {
        newErrors[key as keyof typeof newErrors] = `${key} is required`;

        if (ref.current) ref.current.style.border = "1px solid red";
      } else {
        // if there is an error => remove it
        if (Object.entries(errors).some(([k, val]) => k === key && val)) {
          newErrors[key as keyof typeof newErrors] = "";
        }

        if (ref.current) ref.current.style.removeProperty("border");
      }
    });

    if (Object.keys(newErrors).length) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }

    if (!disableForm && requiredInputs.every(({ value }) => value)) {
      if (!profilePicture && !coverPicture) {
        return registerUser();
      }

      try {
        const uploadImgs = [profilePicture, coverPicture].map((file) => {
          if (file) return uploadMedia([file]);
          return ["no-data"];
        });

        setUploading(true);

        const [profilePictureResponse, coverPictureResponse] =
          await Promise.allSettled(uploadImgs);

        if (
          [profilePictureResponse, coverPictureResponse].every(
            (res) => res?.status === "rejected"
          )
        ) {
          toast.error("something went wrong while upload images");
          return;
        }

        const finalUploadData = {
          variables: {
            userData: {
              username,
              password,
              email,
              address,
            },
          },
        };

        [
          { name: "profilePicture", res: profilePictureResponse },
          { name: "coverPicture", res: coverPictureResponse },
        ].forEach(({ name, res }) => {
          if (res?.status === "fulfilled" && res.value) {
            if (Array.isArray(res.value) && res.value[0] === "no-data") return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (finalUploadData as any).variables.userData[name] = res.value[0];
          }
        });

        registerUser(finalUploadData);
        return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error("can't upload your image at the momment");
        return;
      } finally {
        setUploading(false);
      }
    }
  };

  const REGISTER_USER = gql`
    mutation ($userData: RegisterUserInput!) {
      registerUser(userData: $userData) {
        _id
        username
        email
        profilePicture {
          public_id
          secure_url
        }
        coverPicture {
          public_id
          secure_url
        }
      }
    }
  `;

  const [registerUser, { loading }] = useMutation(REGISTER_USER, {
    variables: {
      userData: {
        username,
        password,
        email,
        address,
      },
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onCompleted({ registerUser: { __typename, ...data } }) {
      setUser(data);
    },

    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "something went wrong while register a new user"
      );
    },
  });

  const disableForm = uploading || loading;

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      className="[&_input]:bg-white my-4 p-3 rounded-md space-y-3 bg-primary bg-opacity-20"
    >
      <AnimatePresence>
        <motion.div layout key="holder-one">
          <motion.div layout="position">
            <Label
              htmlFor="username"
              className="text-primary font-semibold w-fit"
            >
              username
            </Label>
          </motion.div>

          <motion.div layout="position" className="z-10 relative">
            <Input
              ref={usernameRef}
              disabled={disableForm}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              id="username"
              className="py-5 bg-white border-0"
            />
          </motion.div>

          {errors.username && (
            <motion.p
              className="text-red-600 font-bold w-fit z-[9] relative"
              key="username"
              initial={{ x: -10, opacity: 0, transformOrigin: "left" }}
              animate={{ x: 1, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              {errors.username}
            </motion.p>
          )}
        </motion.div>

        <motion.div layout key="holder-two">
          <motion.div layout="position">
            <Label htmlFor="password" className="text-primary font-semibold">
              password
            </Label>
          </motion.div>

          <motion.div layout="position" className="z-10">
            <Input
              ref={passwordRef}
              disabled={disableForm}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              type="password"
              className="py-5 bg-white border-0"
            />
          </motion.div>

          {errors.password && (
            <motion.p
              className="text-red-600 font-bold z-[9]"
              key="password"
              initial={{ x: -10, opacity: 0, transformOrigin: "left" }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        <motion.div layout key="holder-three">
          <motion.div layout="position">
            <Label htmlFor="email" className="text-primary font-semibold">
              email
            </Label>
          </motion.div>

          <motion.div layout="position" className="z-10">
            <Input
              ref={emailRef}
              disabled={disableForm}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              type="email"
              className="py-5 bg-white border-0"
            />
          </motion.div>

          {errors.email && (
            <motion.p
              className="text-red-600 font-bold z-[9]"
              key="email"
              initial={{ x: -10, opacity: 0, transformOrigin: "left" }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        <motion.div layout key="holder-four">
          <motion.div layout="position">
            <Label htmlFor="address" className="text-primary font-semibold">
              address
            </Label>
          </motion.div>

          <motion.div layout="position" className="z-10">
            <Input
              ref={addressRef}
              disabled={disableForm}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              id="address"
              type="text"
              className="py-5 bg-white border-0"
            />
          </motion.div>

          {errors.address && (
            <motion.p
              className="text-red-600 font-bold z-[9]"
              key="address"
              initial={{ x: -10, opacity: 0, transformOrigin: "left" }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              {errors.address}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          layout
          key="holder-five"
          className="flex gap-10 items-stretch"
        >
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
                  disableForm
                    ? "opacity-20 cursor-not-allowed hover:!scale-100"
                    : "cursor-pointer",
                  coverPicture ? "active" : "",
                  "text-primary text-center font-semibold bg-white block rounded-sm shadow-md hover:scale-[1.025] choose-picture-label"
                )}
              >
                {profilePicture ? (
                  <AiOutlineUserSwitch size={30} className="mx-auto" />
                ) : (
                  <MdPersonAddAlt1 size={30} className="mx-auto" />
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
                    title="cancel profile picture"
                    className="red-btn w-full"
                    onClick={() => setProfilePicture(null)}
                    disabled={disableForm}
                  >
                    Cancel
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <input
              accept="image/*"
              ref={profilePictureRef}
              disabled={disableForm}
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
                htmlFor="cover-picture"
                className={classNames(
                  disableForm
                    ? "opacity-20 cursor-not-allowed hover:!scale-100"
                    : "cursor-pointer",
                  coverPicture ? "active" : "",
                  "text-primary text-center font-semibold bg-white block rounded-sm shadow-md hover:scale-[1.025] choose-picture-label"
                )}
              >
                <FaMountainSun size={30} className="mx-auto" />
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
                    title="cancel cover picture"
                    className="red-btn w-full"
                    onClick={() => setCoverPicture(null)}
                    disabled={disableForm}
                  >
                    Cancel
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <input
              accept="image/*"
              ref={coverPictureRef}
              disabled={disableForm}
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
          title="sign up"
          layout="position"
          className="w-full font-semibold py-5 bg-primary"
          disabled={disableForm || uploading}
        >
          {disableForm || uploading ? "Loading..." : "Sign up"}
        </motion.button>
      </Button>

      <motion.p layout="position" className="text-center">
        You already have an account,{" "}
        <Link href="/login" className="underline text-primary">
          Login
        </Link>
      </motion.p>
    </motion.form>
  );
};
export default SignupPage;
