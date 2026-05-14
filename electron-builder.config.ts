import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.danford.claude-usage-bar',
  productName: 'Claude Usage Bar',
  directories: {
    buildResources: 'resources',
    output: 'release'
  },
  files: ['dist/**', 'package.json'],
  mac: {
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    icon: 'resources/icon.icns',
    category: 'public.app-category.utilities'
  },
  dmg: {
    sign: false
  }
}

export default config
