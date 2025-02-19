"use client";

// react
import { useContext } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import Friends from "@/components/friends/Friends";

const FriendsPage = () => {
  const { user } = useContext(authContext);

  return (
    <div className="mt-4">
      <h1 className="text-primary underline font-bold text-2xl mb-4">
        Your Friends
      </h1>

      <Friends mode="COLUMN" userId={user!._id} />
    </div>
  );
};
export default FriendsPage;
