// nextjs
import { useParams } from "next/navigation";

// react
import { useRef, useState, useContext } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// icons
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { HiSwitchHorizontal } from "react-icons/hi";

// types
import type { ReturnTypeOfUseQuery } from "@/lib/types";

// gql
import { DocumentNode, gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

type ProfileType =
  | {
      profileType: "personal";
      updateQuery?: never;
    }
  | {
      profileType: "page";
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    }
  | {
      profileType: "group";
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    };

type Props = {
  settingName: string;
  settingValue: string;
} & ProfileType;

const SettingSlice = ({
  settingName,
  settingValue,
  profileType,
  updateQuery,
}: Props) => {
  const pageId = (useParams()?.pageId || "") as string;

  const { setUser } = useContext(authContext);
  const [activeInput, setActiveInput] = useState(false);
  const newValueInputRef = useRef<HTMLInputElement>(null);

  const UPDATE_USER_INFO = gql`
    mutation ChangeUserData($newUserData: ChangeUserDataInput!) {
      changeUserData(newUserData: $newUserData) {
        ${settingName}
      }
    }
  `;
  const UPDATE_PAGE_INFO = gql`
    mutation ChangePageInfo($editPageData: EditPageInput!) {
      editPage(editPageData: $editPageData) {
        message
      }
    }
  `;

  let query: DocumentNode;
  let queryName: string;

  switch (profileType) {
    case "personal": {
      query = UPDATE_USER_INFO;
      queryName = "changeUserData";
      break;
    }
    case "page": {
      query = UPDATE_PAGE_INFO;
      queryName = "editPage";
      break;
    }
    case "group": {
      query = UPDATE_PAGE_INFO;
      break;
    }
  }

  const [updateProfileInfo, { loading }] = useMutation(query, {
    onCompleted(data, options) {
      if (data?.[queryName]) {
        const newInfo = data?.[queryName]?.[settingName];

        const newValues =
          options?.variables?.[profileType === "page" ? "editPageData" : ""];

        switch (profileType) {
          case "personal": {
            setUser((prev) => ({
              ...prev!,
              [settingName]: newInfo,
            }));
            break;
          }
          case "page": {
            updateQuery?.((prev) => {
              return {
                ...prev!,
                getPageInfo: {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ...(prev as any)!.getPageInfo,
                  [settingName]: newValues[settingName],
                },
              };
            });
            break;
          }
        }

        setActiveInput(false);
      }

      toast.success(
        profileType === "personal"
          ? "your profile updated successfully"
          : "info updated successfully",
        { duration: 9000 }
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          `something went wrong while updating ${
            profileType === "personal" ? "your " : ""
          }${settingName}`,
        {
          duration: 9000,
        }
      );
    },
  });

  return (
    <div className="flex flex-wrap justify-between gap-1.5 items-center bg-primary bg-opacity-10 rounded-md border-l-4 border-primary p-2 text-left">
      <div>
        <p>
          change {profileType === "personal" ? "your " : ""}
          {settingName}
        </p>
        {activeInput ? (
          <Input
            type={settingName === "email" ? "email" : "text"}
            defaultValue={settingValue}
            className="bg-white"
            ref={newValueInputRef}
            disabled={loading}
          />
        ) : (
          <p className="text-gray-600 text-md truncate">{settingValue}</p>
        )}
      </div>

      <div className="flex gap-2">
        {activeInput && (
          <Button
            disabled={loading}
            onClick={() => {
              const newValue = newValueInputRef.current?.value;

              if (!newValue) {
                return toast.error(`new ${settingName} can't be empty`, {
                  duration: 8000,
                });
              }

              if (newValue === settingValue) {
                toast.error(
                  `new ${settingName} can't be the same of old value`,
                  {
                    duration: 9000,
                  }
                );
              }

              let variables: Record<string, unknown>;

              switch (profileType) {
                case "personal": {
                  variables = {
                    newUserData: { [settingName]: newValue },
                  };
                  break;
                }
                case "page": {
                  variables = {
                    editPageData: { pageId, [settingName]: newValue },
                  };
                  break;
                }
                default: {
                  variables = {
                    newUserData: { [settingName]: newValue },
                  };
                }
              }

              updateProfileInfo({ variables });
            }}
          >
            <FaCheckCircle />
            {loading ? "Loading..." : "Submit"}
          </Button>
        )}

        <Button
          className={activeInput ? "bg-red-600 hover:bg-red-500" : ""}
          onClick={() => setActiveInput((prev) => !prev)}
          disabled={loading}
        >
          {activeInput ? (
            <>
              <FaTimesCircle />
              cancel
            </>
          ) : (
            <>
              <HiSwitchHorizontal />
              Change
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
export default SettingSlice;
