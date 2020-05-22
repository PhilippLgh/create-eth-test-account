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

const getKeyStorePath = (networkName = 'goerli') => {
  // TODO support different network IDs
  const dataDir = getDefaultDataDir().replace('~', os.homedir())
  const keystore = path.join(dataDir, networkName, 'keystore')
  return keystore
}

const keystoreExists = () => {
  const p = getKeyStorePath()
  if (fs.existsSync(p)) {
    return p
  }
  return false
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
  // scan keystore AND current working directory
  const workingDirFiles = fs.readdirSync(process.cwd())
  // try to mach eth address in file name as filter so that we don't open and "parse" potentially gigantic files in cwd
  const addressMatcher = /0x[a-fA-F0-9]{40}$/g 
  // don't forget to reset stateful regex!
  const candidates = workingDirFiles.filter(f => (addressMatcher.lastIndex = 0) || addressMatcher.test(f)).map(f => path.join(process.cwd(), f))
  // safe to assume that keystore contains only keyfiles: no pattern matching needed
  candidates.push(...fs.readdirSync(keystore).map(f => path.join(keystore, f)))
  return candidates.map(fullPath => {
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

const exportWallet = async (wallet, password = '', location) => {
  let jsonWallet = await wallet.encrypt(password)
  jsonWallet = JSON.stringify(JSON.parse(jsonWallet), null, 2)
  const walletPath = path.join(location, generateKeystoreFilename(wallet.address))
  fs.writeFileSync(walletPath, jsonWallet)
  return walletPath
}

module.exports = {
  getKeyfiles,
  keystoreExists,
  generateAccount,
  exportWallet
}