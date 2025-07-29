import React from "react";
import { Image } from "./image";

export const Background = () => {
  return (
    <>
     <div
      className="w-full h-screen bg-gradient-to-tr from-gradient-start via-gradient-end via-50% to-[#327547] bg-[length:250%_250%] animate-gradient-xy flex items-center justify-center -z-40 fixed"
    />
    <Image src={"/images/background-image.png"} className="w-screen h-screen -z-30 absolute inset-0 opacity-20"/>
    </>

   
    
  );
};
