import * as os from 'os'
import * as path from 'path'

import clarity from '@blockstack/clarity'
import provider from '@blockstack/clarity/lib/core/provider.js'
import clarityBin from '@blockstack/clarity/lib/providers/clarityBin/index.js'

const { NativeClarityBinProvider } = clarity
const { ProviderConstructor } = provider
import { getDefaultBinaryFilePath } from '@blockstack/clarity-native-bin'

const { InitialAllocation } = clarityBin

export function getTempFilePath(fileNameTemplate) {
  const uniqueID = `${(Date.now() / 1000) | 0}-${Math.random().toString(36).substr(2, 6)}`
  const fileName = fileNameTemplate.replace('{uniqueID}', uniqueID)
  return path.join(os.tmpdir(), fileName)
}

export function providerWithInitialAllocations(allocations) {
  const nativeBinFile = getDefaultBinaryFilePath()
  const tempDbPath = getTempFilePath('blockstack-local-{uniqueID}.db')

  const providerConstructor = {
    create: () =>
      NativeClarityBinProvider.create(allocations, tempDbPath, nativeBinFile),
  }
  return providerConstructor
}