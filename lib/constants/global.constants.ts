  export const isMobile = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );
  };

