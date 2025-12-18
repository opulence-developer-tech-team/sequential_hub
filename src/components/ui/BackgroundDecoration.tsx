'use client'

import Image from 'next/image'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'

export default function BackgroundDecoration() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ 
        zIndex: 0,
        willChange: 'transform',
      }}
    >
      {/* Large Center Watermark - Always visible, big and subtle */}
      <div 
        className="absolute top-1/2 left-1/2 w-[2000px] h-[2000px]"
        style={{
          transform: 'translate(-50%, -50%) rotate(-15deg)',
          opacity: 0.08,
          filter: 'blur(0.2px)',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src={sewingMachineIcon}
            alt=""
            fill
            className="object-contain"
            priority={false}
            quality={40}
            sizes="2000px"
          />
        </div>
      </div>

      {/* Bottom Left - Large watermark */}
      <div 
        className="absolute bottom-0 left-0 w-[1800px] h-[1800px]"
        style={{
          transform: 'translate(-35%, 35%) rotate(-12deg)',
          opacity: 0.07,
          filter: 'blur(0.2px)',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src={sewingMachineIcon}
            alt=""
            fill
            className="object-contain"
            priority={false}
            quality={40}
            sizes="1800px"
          />
        </div>
      </div>

      {/* Top Right - Large watermark */}
      <div 
        className="absolute top-0 right-0 w-[1700px] h-[1700px]"
        style={{
          transform: 'translate(30%, -30%) rotate(18deg)',
          opacity: 0.065,
          filter: 'blur(0.2px)',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src={sewingMachineIcon}
            alt=""
            fill
            className="object-contain"
            priority={false}
            quality={40}
            sizes="1700px"
          />
        </div>
      </div>
    </div>
  )
}






































