"use client";

// nextjs
import Link from "next/link";

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

const LoginPage = () => {
  const { setUser } = useContext(authContext);

  // refs
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors = {} as typeof errors;

    [
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
    ].forEach(({ key, value, ref }) => {
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

    if (!loading && username && password) loginUser();
  };

  const LOGIN_USER = gql`
    mutation ($loginCredintials: LoginUserInput!) {
      loginUser(loginCredintials: $loginCredintials) {
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

  const [loginUser, { loading }] = useMutation(LOGIN_USER, {
    variables: {
      loginCredintials: {
        username,
        password,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onCompleted({ loginUser: { __typename, ...data } }) {
      setUser(data);
    },
    onError({ graphQLErrors }) {
      toast.error(graphQLErrors?.[0]?.message || "something went wrong");
    },
  });

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      className="my-4 p-3 rounded-md space-y-3 bg-primary bg-opacity-20 [&_input]:bg-white"
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
              disabled={loading}
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
              disabled={loading}
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
      </AnimatePresence>

      <Button asChild>
        <motion.button
          layout="position"
          className="w-full font-semibold py-5 bg-primary"
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </motion.button>
      </Button>

      <motion.p layout="position" className="text-center">
        You don’t have account,{" "}
        <Link href="/signup" className="underline text-primary">
          Sign up
        </Link>
      </motion.p>
    </motion.form>
  );
};
export default LoginPage;
