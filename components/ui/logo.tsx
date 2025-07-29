import React from 'react'
import { Image } from './image'
import { Text } from './text'

export const GraphiteLogo = () => {
  return(
    <div className='flex flex-row items-center justify-center'>
  <Image className='w-16 h-16' src={"/images/graphite-icon.png"}/>
  <Text className='uppercase text-sm font-bold tracking-wider ml-[-5px] mt-2'>
    Graphite Names
  </Text>
    </div>
      
    )
}

export const GraphiteIcon = () =>{
    return(
    <Image className='w-20 h-20' src={"/images/graphite-icon.png"}/>
    )
}
