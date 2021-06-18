const os = require('os')
const path = require('path')

const clarity = require('@blockstack/clarity')
const provider = require('@blockstack/clarity/lib/core/provider.js')
const clarityBin = require('@blockstack/clarity/lib/providers/clarityBin/index.js')

const { NativeClarityBinProvider } = clarity
const { ProviderConstructor } = provider
const { getDefaultBinaryFilePath } = require('@blockstack/clarity-native-bin')

const { InitialAllocation } = clarityBin

function getTempFilePath(fileNameTemplate) {
  const uniqueID = `${(Date.now() / 1000) | 0}-${Math.random().toString(36).substr(2, 6)}`
  const fileName = fileNameTemplate.replace('{uniqueID}', uniqueID)
  return path.join(os.tmpdir(), fileName)
}

function providerWithInitialAllocations(allocations) {
  const nativeBinFile = getDefaultBinaryFilePath()
  const tempDbPath = getTempFilePath('blockstack-local-{uniqueID}.db')

  const providerConstructor = {
    create: () =>
      NativeClarityBinProvider.create(allocations, tempDbPath, nativeBinFile),
  }
  return providerConstructor
}

module.exports = {
  getTempFilePath,
  providerWithInitialAllocations,
}