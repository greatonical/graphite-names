import { SVGProps } from "react";

// interface IProps extends SVGProps<SVGSVGElement> {}

export const NavbarExitIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      fill="none"
      viewBox="0 0 48 48"
      {...props}
    >
      <g filter="url(#a)">
        <rect width="48" height="48" fill="url(#b)" rx="24" />
        <path
          stroke="#19191A"
          d="m17.6 17.6 12.8 12.8m0-12.8L17.6 30.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <linearGradient
          id="b"
          x1="0"
          x2="48"
          y1="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#72FB9D" />
          <stop offset="1" stopColor="#429CD3" />
        </linearGradient>
        <filter
          id="a"
          width="108"
          height="108"
          x="-30"
          y="-30"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="15" />
          <feComposite
            in2="SourceAlpha"
            operator="in"
            result="effect1_backgroundBlur_11661_9403"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_backgroundBlur_11661_9403"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};
