// nextjs
import { useParams, useRouter } from "next/navigation";

// react
import { useContext, useEffect } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import Loading from "../Loading";

// shadcn
import { Button } from "../ui/button";

// icons
import { FaHeartCirclePlus } from "react-icons/fa6";
import { FaHeartBroken } from "react-icons/fa";

// gql
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

const IS_USER_FOLLOWING_PAGE = gql`
  query IsUserFollowingPage($pageId: ID!) {
    isUserFollowingPage(pageId: $pageId) {
      isUserFollowingPage
    }
  }
`;

const TOGGLE_PAGE_FOLLOW = gql`
  mutation TogglePageFollow($pageId: ID!) {
    togglePageFollow(pageId: $pageId) {
      message
    }
  }
`;

const TogglePageFollow = () => {
  const router = useRouter();
  const pageId = (useParams()?.pageId || "") as string;

  const { user } = useContext(authContext);

  const [
    getIsUserFollowThisPage,
    { data, loading: isUserFollowingPageLoading, updateQuery },
  ] = useLazyQuery(IS_USER_FOLLOWING_PAGE, { variables: { pageId } });

  const [togglePageFollow, { loading }] = useMutation(TOGGLE_PAGE_FOLLOW, {
    variables: { pageId },

    onCompleted(data) {
      updateQuery((prev) => ({
        ...prev,
        isUserFollowingPage: {
          isUserFollowingPage: !prev?.isUserFollowingPage?.isUserFollowingPage,
        },
      }));

      toast.success(
        data?.togglePageFollow?.message || "your request done successfully",
        { duration: 6000 }
      );
    },

    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't handle your request at the momment",
        { duration: 3000 }
      );
    },
  });

  const isUserFollowThisPage = data?.isUserFollowingPage?.isUserFollowingPage;

  const content = isUserFollowThisPage ? (
    <>
      <FaHeartBroken />
      Unfollow
    </>
  ) : (
    <>
      <FaHeartCirclePlus />
      Follow
    </>
  );

  useEffect(() => {
    if (user) getIsUserFollowThisPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Button
      disabled={isUserFollowingPageLoading || loading}
      onClick={() => {
        if (!user) {
          return toast.error("you need to login first", {
            duration: 9000,
            action: {
              label: "Login",
              onClick: () => {
                router.push("/login");
              },
            },
          });
        }

        togglePageFollow();
      }}
    >
      {isUserFollowingPageLoading || loading ? (
        <Loading size={18} fill="white" withText />
      ) : (
        content
      )}
    </Button>
  );
};
export default TogglePageFollow;
