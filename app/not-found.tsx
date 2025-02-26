// nextjs
import Link from "next/link";

// shadcn
import { Button } from "@/components/ui/button";

// icons
import { IoHomeSharp } from "react-icons/io5";

const notFound = () => {
  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <h1 className="font-bold text-2xl mb-2 text-primary">
        This Page Not Found
      </h1>
      <Button asChild>
        <Link href="/" title="back to home">
          <IoHomeSharp />
          Back To Home
        </Link>
      </Button>
    </div>
  );
};
export default notFound;
