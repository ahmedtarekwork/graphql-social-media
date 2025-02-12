"use client";

// nextjs
import Image, { type ImageProps } from "next/image";

// react
import { useEffect, useRef, useState } from "react";

// components
import Loading from "./Loading";

// utils
import classNames from "classnames";

const ImageWithLoading = (props: ImageProps) => {
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (props.src) {
      (async () => {
        try {
          const response = await fetch(
            props.src as Parameters<typeof fetch>["0"]
          );

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
    if (props.width && props.height) {
      return (
        <div
          style={{
            width: props.width + "px",
            height: props.height + "px",
          }}
        >
          <Loading size={+props.width - (+props.width >= 20 ? 7 : 0)} />
        </div>
      );
    } else {
      return <Loading />;
    }
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
