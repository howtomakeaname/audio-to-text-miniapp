import { mpxConfig } from '@mpxjs/eslint-config'
export default mpxConfig(
  {
    mpx: true,
    typescript: false,
    env: {
      wx: true
    },
    globals: {
      wx: 'readonly'
    }
  }
)
