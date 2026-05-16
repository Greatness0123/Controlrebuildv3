/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.control.app',
  productName: 'Control',
  directories: {
    output: 'dist',
    buildResources: 'assets'
  },
  files: [
    'out/**/*',
    'electron/**/*',
    'package.json'
  ],
  extraResources: [
    'assets/**/*'
  ],
  asar: true,
  asarUnpack: [
    '**/node_modules/@picovoice/porcupine-node/**/*',
    '**/node_modules/@picovoice/pvrecorder-node/**/*',
    '**/node_modules/screenshot-desktop/**/*',
    'electron/backends/**/*',
    'assets/wakeword/**/*'
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    category: 'public.app-category.productivity'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      }
    ],
    category: 'Office'
  }
}
