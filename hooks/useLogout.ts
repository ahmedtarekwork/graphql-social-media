// nextjs
import { useRouter } from "next/navigation";

// react
import { useContext, useState } from "react";

// gql
import { useApolloClient } from "@apollo/client";

// utils
import { toast } from "sonner";

// type
import { authContext } from "@/contexts/AuthContext";

const useLogout = (handleLoading = true) => {
  const router = useRouter();
  const client = useApolloClient();

  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(authContext);

  const logout = async () => {
    if (handleLoading) setLoading(true);
    try {
      await fetch("/api/logout");
      await client.clearStore();
      setUser(null);
      router.push("/login");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("can't logout at the momment");
      console.log(err);
    } finally {
      if (handleLoading) setLoading(false);
    }
  };

  return {
    logout,
    loading,
  };
};

export default useLogout;
