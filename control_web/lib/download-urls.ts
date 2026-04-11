export interface PlatformDownload {
  name: string;
  description: string;
  url: string;
}

export type PlatformDownloads = PlatformDownload[];

export const DESKTOP_DOWNLOAD_URLS: Record<string, PlatformDownloads> = {
  mac: [
    {
      name: 'Apple Silicon (M1/M2/M3)',
      description: 'For Mac with Apple chip',
      url: 'https://github.com/Greatness0123/Controlrebuildv3/releases/download/v1.0.0/Control-1.0.0-arm64.dmg',
    },
    {
      name: 'Intel',
      description: 'For older Mac computers',
      url: 'https://github.com/Greatness0123/Controlrebuildv3/releases/download/v1.0.0/Control-1.0.0.dmg',
    },
  ],
  windows: [
    {
      name: 'Installer (Recommended)',
      description: 'NSIS installer with guided setup',
      url: 'https://github.com/Greatness0123/Controlrebuildv3/releases/download/v1.0.0/Control-Setup-1.0.0.exe',
    },
    {
      name: 'Portable',
      description: 'No installation required',
      url: 'https://github.com/Greatness0123/Controlrebuildv3/releases/download/v1.0.0/Control-1.0.0.exe',
    },
  ],
  linux: [
    {
      name: 'AppImage',
      description: 'Works on most Linux distributions',
      url: 'https://github.com/Greatness0123/Controlrebuildv3/releases/download/v1.0.0/Control-1.0.0.AppImage',
    },
    {
      name: 'deb Package',
      description: 'For Debian/Ubuntu',
      url: 'https://github.com/Greatness0123/Controlrebuildv3/releases/download/v1.0.0/control_1.0.0_amd64.deb',
    },
  ],
};