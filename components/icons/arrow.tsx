import { SVGProps } from "react";

// interface IProps extends SVGProps<SVGSVGElement> {}

export const Arrow = (props: SVGProps<SVGSVGElement> ) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="6"
      fill="none"
      viewBox="0 0 10 6"
      {...props}
    >
      <path
        stroke="#0073E6"
        d="M9 1 5 5 1 1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};
