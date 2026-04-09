'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const fadeTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

const softwareLogos = [
  { name: 'Blender', src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnJWv8OMc3xyH7Omf0GWQ2twaIKx_ft05uXQ&s' },
  { name: 'AutoCAD', src: 'https://logosandtypes.com/wp-content/uploads/2025/03/AutoCAD.png' },
  { name: 'Premiere Pro', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Adobe_Photoshop_Lightroom_CC_logo.svg/512px-Adobe_Photoshop_Lightroom_CC_logo.svg.png' },
  { name: 'Photoshop', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Adobe_Photoshop_CC_icon.svg/512px-Adobe_Photoshop_CC_icon.svg.png' },
  { name: 'After Effects', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Adobe_After_Effects_CC_icon.svg/512px-Adobe_After_Effects_CC_icon.svg.png' },
  { name: 'Maya', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Maya_2017_icon.svg/512px-Maya_2017_icon.svg.png' },
  { name: 'Unity', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Unity_logo.svg/512px-Unity_logo.svg.png' },
  { name: 'Unreal Engine', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Unreal_Engine_Logo.svg/512px-Unreal_Engine_Logo.svg.png' },
  { name: 'Figma', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/512px-Figma-logo.svg.png' },
  { name: 'DaVinci Resolve', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/DaVinci_Resolve_17_logo.svg/512px-DaVinci_Resolve_17_logo.svg.png' },
];

const platformLogos = [
  { name: 'Windows', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Windows_logo_-_2021.svg/512px-Windows_logo_-_2021.svg.png' },
  { name: 'macOS', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/MacOS_logo_%282017%29.svg/512px-MacOS_logo_%282017%29.svg.png' },
  { name: 'Linux', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Linux_Logo_Mint.png/512px-Linux_Logo_Mint.png' },
];

export function SoftwareLogos({ className = '', showLabels = false }: { className?: string; showLabels?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 sm:gap-6 ${className}`}>
      {softwareLogos.map((logo, i) => (
        <motion.div
          key={logo.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...fadeTransition, delay: i * 0.05 }}
          className="relative group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-white/20 group-hover:bg-white/10">
            <Image
              src={logo.src}
              alt={logo.name}
              width={36}
              height={36}
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              unoptimized
            />
          </div>
          {showLabels && (
            <span className="text-xs text-neutral-400 font-medium ml-2">{logo.name}</span>
          )}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {logo.name}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PlatformLogos({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {platformLogos.map((platform, i) => (
        <motion.div
          key={platform.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...fadeTransition, delay: i * 0.1 }}
          className="relative group"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <Image
                src={platform.src}
                alt={platform.name}
                width={36}
                height={36}
                className="w-7 h-7 object-contain"
                unoptimized
              />
            </div>
            <span className="text-sm font-medium text-neutral-300">{platform.name}</span>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {platform.name}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SoftwareLogosWithHover({ className = '' }: { className?: string }) {
  return <SoftwareLogos className={className} showLabels={false} />;
}
