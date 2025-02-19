// nextjs
import { useParams } from "next/navigation";

// react
import { useRef, useState } from "react";

// components
import Loading from "@/components/Loading";

// shadcn
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// utils
import { Types } from "mongoose";
import { toast } from "sonner";

// gql
import { gql, useMutation } from "@apollo/client";

const ADD_NEW_ADMIN_TO_PAGE = gql`
  mutation AddNewAdminToPage($toggleAdminData: PageAdminInput!) {
    togglePageAdmin(toggleAdminData: $toggleAdminData) {
      message
    }
  }
`;

const AddNewAdminBtn = () => {
  const pageId = (useParams()?.pageId || "") as string;

  const newAdminIdInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);

  const [addNewAdmin, { loading }] = useMutation(ADD_NEW_ADMIN_TO_PAGE, {
    onCompleted(data) {
      setOpen(false);
      toast.success(
        data?.togglePageAdmin?.message || "admin added successfully"
      );
    },
    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message || "can't add this admin at the momment"
      );
    },
  });

  const handleAddNewAdmin = () => {
    if (loading) return;
    const adminId = newAdminIdInputRef.current?.value;

    if (!adminId || !Types.ObjectId.isValid(adminId)) {
      return toast.error(
        adminId
          ? "this id for new admin not valid"
          : "user id is required to make him admin"
      );
    }

    addNewAdmin({
      variables: {
        toggleAdminData: {
          newAdminId: adminId,
          pageId,
          toggle: "add",
        },
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button asChild>
        <AlertDialogTrigger disabled={loading}>
          {loading ? "Adding..." : "+ Add"}
        </AlertDialogTrigger>
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add new admin</AlertDialogTitle>

          <AlertDialogDescription>add admin id here</AlertDialogDescription>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddNewAdmin();
            }}
          >
            <Input placeholder="id here..." ref={newAdminIdInputRef} />
          </form>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button onClick={handleAddNewAdmin} disabled={loading}>
            {loading ? (
              <Loading size={18} withText text="Adding..." fill="white" />
            ) : (
              "Add admin"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default AddNewAdminBtn;
