"use client";

// nextjs
import Image, { type ImageProps } from "next/image";

// react
import { useEffect, useRef, useState } from "react";

// components
import Loading from "./Loading";

// utils
import classNames from "classnames";

const ImageWithLoading = ({
  spinnerFill,
  customSize,
  ...props
}: ImageProps & { customSize?: number; spinnerFill?: "white" | "primary" }) => {
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (props.src) {
      (async () => {
        try {
          const response = await fetch(props.src as string, {
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          const blob = await response.blob();

          setSrc(URL.createObjectURL(blob));
        } catch (_) {
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [props.src]);

  useEffect(() => {
    if (!loading) {
      imgRef.current?.classList.remove("opacity-0");
    }
  }, [loading]);

  if (loading) {
    if ((props.width && props.height) || customSize) {
      const width = (customSize || props.width)!;
      const height = (customSize || props.height)!;

      return (
        <div
          className="grid place-content-center mx-auto"
          style={{
            width: width + "px",
            height: height + "px",
          }}
        >
          <Loading fill={spinnerFill} size={+width - (+width >= 20 ? 7 : 0)} />
        </div>
      );
    }

    return <Loading fill={spinnerFill} />;
  }

  return (
    <Image
      {...props}
      ref={imgRef}
      src={src}
      className={classNames(
        props.className,
        "transition-opacity opacity-0 duration-500"
      )}
    />
  );
};
export default ImageWithLoading;
