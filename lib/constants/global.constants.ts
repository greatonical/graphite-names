export const isMobile = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
};

export const routes = [
  {
    id: 0,
    title: "Manage Domains",
    icon: "mdi:web",
    link: "/manage",
  },
  {
    id: 1,
    icon: "mdi:domain",
    title: "Subdomains",
    link: "/subdomains",
  },
  // {
  //   id: 2,
  //   icon: "mdi:gavel",
  //   title: "Auctions",
  //   link: "/auctions",
  // },
];
