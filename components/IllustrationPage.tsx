// nextjs
import Image from "next/image";
import Link from "next/link";

// react
import type { ReactNode } from "react";

// components
// shadcn
import { Button } from "@/components/ui/button";

// icons
import { MdHome } from "react-icons/md";

// types
import type { StaticImport } from "next/dist/shared/lib/get-img-props";

export type IllustrationPageBtnType =
  | {
      type: "go-to-home";
      component?: never;
    }
  | {
      type: "custom";
      component: ReactNode;
    };

type Props = {
  content: ReactNode;
  svg: StaticImport;
  btn: IllustrationPageBtnType;
};

const IllustrationPage = ({ content, svg, btn }: Props) => {
  return (
    <>
      <Image
        src={svg}
        alt="illustration"
        width={300}
        height={300}
        className="max-h-[300px] max-w-full mx-auto"
        priority
      />

      <h1 className="text-primary font-bold text-2xl text-center my-4">
        {content}
      </h1>

      {btn.type === "go-to-home" ? (
        <Button asChild className="w-fit mx-auto">
          <Link title="go to home" href="/">
            <MdHome size={20} />
            <p>Go to home</p>
          </Link>
        </Button>
      ) : (
        btn.component
      )}
    </>
  );
};
export default IllustrationPage;
