'use client';

import { motion } from 'framer-motion';

const fadeTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

export function SoftwareLogos({ className = '', showLabels = false }: { className?: string; showLabels?: boolean }) {
  const logos = [
    { name: 'Blender', color: '#EA7600' },
    { name: 'AutoCAD', color: '#0696D7' },
    { name: 'Premiere Pro', color: '#9999FF' },
    { name: 'Photoshop', color: '#31A8FF' },
    { name: 'After Effects', color: '#9999FF' },
    { name: 'Maya', color: '#0696D7' },
    { name: 'Unity', color: '#FFFFFF' },
    { name: 'Unreal Engine', color: '#FFFFFF' },
    { name: 'Figma', color: '#F24E1E' },
    { name: 'DaVinci Resolve', color: '#2383D1' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-6 sm:gap-8 ${className}`}>
      {logos.map((logo, i) => (
        <motion.div
          key={logo.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...fadeTransition, delay: i * 0.05 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center"
            style={{ backgroundColor: logo.color + '15', border: `1px solid ${logo.color}30` }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill={logo.color}>
              {getLogoPath(logo.name)}
            </svg>
          </div>
          {showLabels && (
            <span className="text-xs text-neutral-400 font-medium">{logo.name}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function getLogoPath(name: string): string {
  const paths: Record<string, string> = {
    Blender: 'M3.268 4.438l9.615 5.53c.968.557 1.42.746 1.992.746.968 0 1.795-.523 2.548-1.44l4.57-2.635c.753-.434 1.513-.653 2.28-.653.767 0 1.527.22 2.28.653l1.527.878v2.438l-1.527.878c-.753.434-1.513.653-2.28.653-.767 0-1.527-.22-2.28-.653l-9.614-5.528c-.968-.558-1.42-.747-1.993-.747-.972 0-1.795.523-2.548 1.44l-4.57 2.634c-.753.435-1.513.654-2.28.654-.768 0-1.527-.22-2.28-.653L1.54 7.14V4.702l1.728-.878c.753-.434 1.513-.653 2.28-.653.767 0 1.527.22 2.28.653l9.614 5.528c.968.558 1.42.747 1.992.747.973 0 1.796-.523 2.549-1.44l1.527-.878',
    'AutoCAD': 'M5.5 3A2.5 2.5 0 003 5.5v13A2.5 2.5 0 005.5 21h13a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0018.5 3h-13zm7.5 4h3.5v11h-3.5V7zm-7 0h3.5v11H6V7zm-1.5 0h3v3H4.5v-3zm0 4h3v3H4.5v-3zm0 4h3v3H4.5v-3z',
    'Premiere Pro': 'M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm6.5 13.5l-3-3 3-3v6zm3-7.5h-4l-2 5 2 5h4l2-5-2-5z',
    'After Effects': 'M8 4h8a1 1 0 011 1v14a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1zm5 13.5l-2.5-2.5L8 17.5v-1l2.5-2.5 2.5 2.5v-1.5l-2.5-2.5 2.5-2.5v-1L10.5 12 8 14.5v1L5.5 12 8 9.5v1l-2.5 2.5L8 16v-1.5l2.5 2.5L8 20l2.5-2.5z',
    Maya: 'M12 2L2 19h20L12 2zm-5 14l5-10h4l-5 10-5-10h4l5 10z',
    Unity: 'M8.5 2.5l-7 5.5 7 5.5v-11zm7 0l7 5.5-7 5.5v-11zm-3.5 11l-3.5-3v6l3.5-3zm7 0l3.5-3v6l-3.5-3z',
    Figma: 'M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4zM4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4zm8-8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V4h4zm8-4c0-2.2-1.8-4-4-4h-4v8h4c2.2 0 4-1.8 4-4z',
    'DaVinci Resolve': 'M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zm3 4l3 4-3 4V7zm6 0l3 4-3 4V7z',
  };
  return paths[name] || '';
}

export function PlatformLogos({ className = '' }: { className?: string }) {
  const platforms = [
    { name: 'Windows', color: '#0078D4', path: 'M3 5.5l8-2.5v10l-8-2.5V5.5zm8 0l8-2.5v10l-8-2.5V5.5zM3 11.5l8 2.5v7l-8-2.5v-7zm8 0l8 2.5v7l-8-2.5v-7z' },
    { name: 'macOS', color: '#999999', path: 'M12 3c-2.5 0-4.5 2-4.5 4.5 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5C16.5 5 14.5 3 12 3zm0 6c-.8 0-1.5-.7-1.5-1.5S11.2 6 12 6s1.5.7 1.5 1.5S12.8 9 12 9z' },
    { name: 'Linux', color: '#FCC624', path: 'M4.8 6.5l1.4-1.3c.2-.2.5-.2.7 0l1.5 1.4c.4.4.4 1 0 1.4l-1.4 1.3c-.2.2-.5.2-.7 0l-1.5-1.4c-.4-.4-.4-1 0-1.4zM8.7 5.2l.6-.6c.2-.2.5-.2.7 0l.9.9c.2.2.2.5 0 .7l-.6.6c-.2.2-.5.2-.7 0l-.9-.9c-.2-.2-.2-.5 0-.7zm1.7 2.1l1.2-1.1c.2-.2.5-.2.7 0l1.4 1.4c.2.2.2.5 0 .7l-1.2 1.1c-.2.2-.5.2-.7 0l-1.4-1.4c-.2-.2-.2-.5 0-.7zm-4.7.6l1.3-1.2c.2-.2.5-.2.7 0l.9.9c.2.2.2.5 0 .7l-1.3 1.2c-.2.2-.5.2-.7 0l-.9-.9c-.2-.2-.2-.5 0-.7zm-2.3.9l-.5-.5c-.2-.2-.2-.5 0-.7l1.5-1.4c.2-.2.5-.2.7 0l.5.5c.2.2.2.5 0 .7l-1.5 1.4c-.2.2-.5.2-.7 0zM11 11l.7-.7c.2-.2.2-.5 0-.7l-1.4-1.4c-.2-.2-.5-.2-.7 0l-.7.7c-.2.2-.2.5 0 .7l1.4 1.4c.2.2.5.2.7 0z' },
  ];

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {platforms.map((platform, i) => (
        <motion.div
          key={platform.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...fadeTransition, delay: i * 0.1 }}
          className="flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill={platform.color}>
            <path d={platform.path} />
          </svg>
          <span className="text-sm font-medium text-neutral-300">{platform.name}</span>
        </motion.div>
      ))}
    </div>
  );
}