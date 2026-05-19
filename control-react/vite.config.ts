import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.js'),
        formats: ['cjs']
      },
      rollupOptions: {
        external: [
          '@nut-tree/nut-js',
          'screenshot-desktop',
          '@picovoice/porcupine-node',
          '@picovoice/pvrecorder-node',
          'sharp',
          'vosk',
          'edge-tts',
          'node-global-key-listener',
          'python-shell',
          'jimp',
          'imagescript',
          'playwright'
        ]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      rollupOptions: {
        input: {
          chat: resolve(__dirname, 'src/windows/chat/index.html'),
          entry: resolve(__dirname, 'src/windows/entry/index.html'),
          settings: resolve(__dirname, 'src/windows/settings/index.html'),
          overlay: resolve(__dirname, 'src/windows/overlay/index.html'),
          'ghost-cursor': resolve(__dirname, 'src/windows/ghost-cursor/index.html'),
          lite: resolve(__dirname, 'src/windows/lite/index.html'),
          workflow: resolve(__dirname, 'src/windows/workflow/index.html')
        }
      }
    }
  }
})
