"use client";
import React, { useEffect, useState } from "react";
import {
  LazyLoadImage,
  LazyLoadImageProps,
} from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface ImageProps extends LazyLoadImageProps {
  /** Fallback URL when `src` errors out */
  fallbackSrc?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  fallbackSrc = "/images/ndollar-icon.svg",
  onError,
  ...props
}) => {
  // Track the current src; start with the passed-in src
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    typeof src === "string" ? src : undefined
  );

  // When an error fires, swap to the fallback
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    // propagate if parent also provided onError
    onError?.(e as any);
  };

    useEffect(() => {
    setImgSrc(src?.toString());
   
  }, [src]);

  return (
    <LazyLoadImage
      {...props}
      src={imgSrc}
      onError={handleError}
      effect="black-and-white"
      wrapperProps={{
        style: { transitionDelay: "1s", pointerEvents: "none" },
      }}
    />
  );
};
