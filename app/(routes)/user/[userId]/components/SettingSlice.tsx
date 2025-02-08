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
import type { UserType } from "@/lib/types";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";

type Props = {
  settingName: string;
  settingValue: string;
};

const SettingSlice = ({ settingName, settingValue }: Props) => {
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

  const [updateUserInfo, { loading: updateUserInfoLoading }] = useMutation(
    UPDATE_USER_INFO,
    {
      onCompleted(data) {
        if (data.changeUserData) {
          const newInfo = data.changeUserData[settingName];

          setUser((prev) => ({
            ...(prev as unknown as UserType),
            [settingName]: newInfo,
          }));

          setActiveInput(false);
        } else {
          toast.error(
            `something went wrong while updating your ${settingName}`,
            { duration: 9000 }
          );
        }
      },
      onError(error) {
        console.log(error);
        toast.error(`something went wrong while updating your ${settingName}`, {
          duration: 9000,
        });
      },
    }
  );

  return (
    <div className="flex flex-wrap justify-between gap-1.5 items-center bg-primary bg-opacity-10 rounded-md border-l-4 border-primary p-2">
      <div>
        <p>change your {settingName}</p>
        {activeInput ? (
          <Input
            type={settingName === "email" ? "email" : "text"}
            defaultValue={settingValue}
            className="bg-white"
            ref={newValueInputRef}
            disabled={updateUserInfoLoading}
          />
        ) : (
          <p className="text-gray-600 text-md">{settingValue}</p>
        )}
      </div>

      <div className="flex gap-2">
        {activeInput && (
          <Button
            disabled={updateUserInfoLoading}
            onClick={() => {
              const newValue = newValueInputRef.current?.value;

              if (!newValue) {
                return toast.error(`new ${settingName} can't be empty`, {
                  duration: 8000,
                });
              }

              if (newValue === settingValue) {
                toast.error(
                  `new ${settingName} can't be the same of old ${settingName}`,
                  {
                    duration: 9000,
                  }
                );
              }

              updateUserInfo({
                variables: {
                  newUserData: { [settingName]: newValue },
                },
              });
            }}
          >
            <FaCheckCircle />
            {updateUserInfoLoading ? "Loading..." : "Submit"}
          </Button>
        )}

        <Button
          className={activeInput ? "bg-red-600 hover:bg-red-500" : ""}
          onClick={() => setActiveInput((prev) => !prev)}
          disabled={updateUserInfoLoading}
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
