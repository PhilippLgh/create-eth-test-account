const crypto = require('crypto')
const axios = require('axios')
const jwt = require('jsonwebtoken')

const createHmac = (text, key) => {
  const hmac = crypto.createHmac('sha512', key)
  hmac.update(text)
  return hmac.digest('hex')
}

const FAUCET_API = 'https://api.ethfaucet.org'

const getCaptcha = async () => {
  try {
    const { data } = await axios.get(`${FAUCET_API}/captcha/${process.stdout.columns}/${process.stdout.rows * 2}`)
    return data
  } catch (error) {
    const { response } = error
    if (response) {
      console.error('Get captcha error:', response.status, response.statusText)
    } else {
      console.error('Get captcha error:', error.code)
    }
    process.exit()
  }
}

const checkCaptcha = async (token, answer) => {
  const decoded = jwt.decode(token)
  const { challenge, salt} = decoded
  const response = createHmac(answer, salt)
  return response === challenge
}

const requestFunds = async (address, challenge, response) => {
  const networkId = 5 // goerli
  const { data } = await axios.get(`${FAUCET_API}/faucet/${networkId}/${address}`, {
    headers: {
      Authorization: `${challenge}.${response}`
    }
  })
  return data
}

module.exports = {
  getCaptcha,
  checkCaptcha,
  requestFunds
}