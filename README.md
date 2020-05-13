# create eth-test-account

## :unicorn: Fastest way to get setup with Ethereum :unicorn:

```shell
npm create eth-test-account
```

💸💸💸 Get test Ether for the goerli testnet instantly! 💸💸💸
It uses the faucet at: https://api.ethfaucet.org

## Generate a pre-funded test account in seconds :rocket:

<p align="center"><img src="/img/install.gif?raw=true"/></p>

###  What is the password?
>"" (empty string)


### Do I need social media verification to use this?
> Nope. Hopefully a thing of the past. Might need to adjust CAPCTHAs in the future.

### Can i sell my test ether?
> No.

### What if I lose the key?
> Generate a new one: npm create ethereum-test-account


### Is it possible to use the same functionality in my tool?
> The API is rather simple and it should be totally possible

Take a look at `faucet.js`
```javascript
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
```

## Have fun!