#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { prompt, Select } = require('enquirer')
const chalk = require('chalk')
const { getCaptcha, checkCaptcha, requestFunds } = require('../lib/faucet')
const { getKeyfiles, keystoreExists, generateAccount, exportWallet } = require('../lib/accounts')

const getResponse = async prompt => {
  try {
    let answer = await prompt.run()
    return answer
  } catch (error) {
    process.exit()
    return undefined
  }
}

const getOrCreateAccount = async () => {
  const keyfiles = getKeyfiles()
  if (keyfiles.length > 0) {
    console.log(chalk.bold(`Found ${keyfiles.length} existing accounts`))
    let prompt = new Select({
      name: 'accountType',
      message: 'Do you want to create a new account or top up?',
      choices: ['top up existing', 'new account']
    });

    let answer = await getResponse(prompt)

    if (answer === 'top up existing') {

      prompt = new Select({
        name: 'selectedAccount',
        message: 'Which account?',
        choices: keyfiles.map(acc => ({
          name: acc.address,
          message: `${acc.address} - ${acc.created}`
        }))
      });
  
      answer = await getResponse(prompt)
      return {
        wallet: undefined,
        address: answer
      }

    }
    // else create new account 
  }
  // else create new account
  const { wallet, address } = await generateAccount()
  return {
    wallet,
    address
  }
}

const run = async () => {
  const { wallet, address } = await getOrCreateAccount()
  if (wallet) {
    console.log(chalk.bold(`Created new account: ${address}`))
  }
  console.log(chalk.bold('Generating CAPTCHA for quick check if you are human ;-)'))
  const { captcha, challenge } = await getCaptcha()

  // render captcha to cli
  console.log(captcha)

  let isValid = false
  let answer = ''
  while (!isValid) {
    // ask user for captcha
    try {
      let result = await prompt({
        type: 'input',
        name: 'answer',
        message: 'Please enter the captcha'
      })
      answer = result.answer
      isValid = await checkCaptcha(challenge, answer)
      if(!isValid) {
        console.log(chalk.red.bold('>> Wrong captcha - please try again'))
      }
    } catch (error) {
      process.exit()
    }
  }

  console.log(chalk.blueBright.bold('Success! Requesting funds..'))

  let txHash
  try {
    txHash = await requestFunds(address, challenge, answer)
  } catch (error) {
    const { response } = error
    const { status, statusText, data } = response
    console.log(chalk.red.bold('Server error', status, statusText, data))
    process.exit()
  }
  console.log('1 Ether is on the way...')
  console.log(`https://goerli.etherscan.io/tx/${txHash}`)

  if (wallet) {
    let keyStore = keystoreExists()
    let exportDir = process.cwd()
    if (keyStore) {
      let prompt = new Select({
        name: 'accountLocation',
        message: 'Where do you want to store the key?',
        choices: [{
          name: keyStore,
          message: keyStore + chalk.bold(' (default keystore location)')
        }, process.cwd]
      });
      let answer = await getResponse(prompt)
      exportDir = answer
    }
    const password = ''
    const walletPath = await exportWallet(wallet, password, exportDir)
    console.log(chalk.bold('Wallet written to: ', walletPath))
  }


  // TODO wait for tx ?

  console.log(chalk.bold('Enjoy your pre-funded test account'))

  return
}


run()