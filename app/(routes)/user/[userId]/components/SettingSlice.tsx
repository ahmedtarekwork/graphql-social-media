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
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

type ProfileType =
  | {
      profileType: "personal";
      updateQuery?: never;
    }
  | {
      profileType: "page" | "group";
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
  const capitalCommunityName = `${profileType[0].toUpperCase()}${profileType.slice(
    1
  )}`;

  const params = useParams();

  let queryName = "changeUserData";

  if (profileType !== "personal") queryName = `edit${capitalCommunityName}`;

  const { setUser } = useContext(authContext);
  const [activeInput, setActiveInput] = useState(false);
  const newValueInputRef = useRef<HTMLInputElement>(null);

  const UPDATE_USER_INFO = gql`
    mutation ChangeUserData($newUserData: ChangeUserDataInput!) {
      ${queryName}(newUserData: $newUserData) {
        ${settingName}
      }
    }
  `;
  const UPDATE_COMMUNITY_INFO = gql`
    mutation Change${capitalCommunityName}Info($${queryName}Data: Edit${capitalCommunityName}Input!) {
      ${queryName}(${queryName}Data: $${queryName}Data) {
        message
      }
    }
  `;

  const [updateProfileInfo, { loading }] = useMutation(
    profileType === "personal" ? UPDATE_USER_INFO : UPDATE_COMMUNITY_INFO,
    {
      onCompleted(data, options) {
        if (data?.[queryName]) {
          const newInfo = data?.[queryName]?.[settingName];

          switch (profileType) {
            case "personal": {
              setUser((prev) => ({
                ...prev!,
                [settingName]: newInfo,
              }));
              break;
            }
            case "group":
            case "page": {
              updateQuery?.((prev) => {
                const newValues = options?.variables?.[`${queryName}Data`];

                const getProfileInfoQueryName =
                  profileType === "page" ? "getPageInfo" : "getSingleGroup";

                return {
                  ...prev!,
                  [getProfileInfoQueryName]: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(prev as any)?.[getProfileInfoQueryName],
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
              profileType === "personal" ? "your " : profileType
            }${settingName}`,
          {
            duration: 9000,
          }
        );
      },
    }
  );

  return (
    <div className="flex flex-wrap justify-between gap-1.5 items-end bg-primary bg-opacity-10 rounded-md border-l-4 border-primary p-2 text-left">
      <div className="flex-1">
        <p>
          change {profileType === "personal" ? "your " : ""}
          {settingName}
        </p>
        {activeInput ? (
          <Input
            type={settingName === "email" ? "email" : "text"}
            defaultValue={settingValue}
            className="bg-white w-full"
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
                case "group":
                case "page": {
                  variables = {
                    [`${queryName}Data`]: {
                      [`${profileType}Id`]: params?.[`${profileType}Id`] || "",
                      [settingName]: newValue,
                    },
                  };
                  break;
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
