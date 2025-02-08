"use client";

// react
import {
  createContext,
  ReactNode,
  useState,

  // types
  type Dispatch,
  type SetStateAction,
} from "react";

// types
import type { PostsResponse } from "@/lib/types";

type ContextType = {
  setData: Dispatch<SetStateAction<PostsResponse>>;
  data: PostsResponse;
};

const initialData = {
  data: { isFinalPage: false, posts: [] },
  setData: () => {},
};

export const PostsContext = createContext<ContextType>(initialData);

const PostsProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<ContextType["data"]>(initialData.data);

  return (
    <PostsContext.Provider value={{ data, setData }}>
      {children}
    </PostsContext.Provider>
  );
};
export default PostsProvider;
