"use client";

// react
import { useState } from "react";

// components
import PostForm from "@/components/Posts/postForm/PostForm";
import PostsPreviewer from "@/components/Posts/PostsPreviewer";

export default function Home() {
  const [fetchMoreLoading, setFetchMoreLoading] = useState(false);

  return (
    <div className="space-y-2">
      <PostForm profileType="personal" mode="new" homePage />

      <PostsPreviewer
        mode="homePage"
        fetchMoreLoading={fetchMoreLoading}
        setFetchMoreLoading={setFetchMoreLoading}
      />
    </div>
  );
}
