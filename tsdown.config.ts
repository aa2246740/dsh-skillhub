import { externalClientBundle } from '../../tools/dshx/src/client-build.js'

export default externalClientBundle('dsh-skillhub', ['lib/types/dsh-skillhub.js'], {
  clientEntry: 'src/client/index.tsx',
})
