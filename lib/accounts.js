const fs = require('fs')
const path = require('path')
const os = require('os')
const ethers = require('ethers')

const getDefaultDataDir = () => {
  switch (process.platform) {
    case 'win32': return `${process.env.APPDATA}/Ethereum`
    case 'linux': return '~/.ethereum'
    case 'darwin': return '~/Library/Ethereum'
    default: return '~/.ethereum'
  }
}

const getKeyStorePath = () => {
  // TODO support different network IDs
  const dataDir = getDefaultDataDir().replace('~', os.homedir())
  const keystore = path.join(dataDir, 'keystore')
  return keystore
}

const generateKeystoreFilename = (address) => {
  var filename = `ceta-UTC--${new Date().toISOString().split(':').join('-')}--${address}`
  return filename;
}

const getKeyfiles = () => {
  const keystore = getKeyStorePath()
  if (!fs.existsSync(keystore)) {
    return []
  }
  return fs.readdirSync(keystore).map(f => {
    const fullPath = path.join(keystore, f)
    try {
      const stat = fs.statSync(fullPath)
      const wallet = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
      const { address, version } = wallet
      return {
        version,
        address: `0x${address}`,
        fullPath,
        created: stat.birthtime
      }
    } catch (error) {
      return undefined
    }
  }).filter(w => w !== undefined)
}

const generateAccount = async () => {
  const wallet = ethers.Wallet.createRandom()
  const address = wallet.address
  return {
    wallet,
    address
  }
}

const exportWallet = async (wallet, password = '') => {
  let jsonWallet = await wallet.encrypt(password)
  jsonWallet = JSON.stringify(JSON.parse(jsonWallet), null, 2)
  const walletPath = generateKeystoreFilename(wallet.address)
  fs.writeFileSync(walletPath, jsonWallet)
  return walletPath
}

module.exports = {
  getKeyfiles,
  generateAccount,
  exportWallet
}