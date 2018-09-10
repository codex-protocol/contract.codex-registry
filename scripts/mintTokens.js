const axios = require('axios')
const util = require('ethereumjs-util')

const CodexRecord = artifacts.require('./CodexRecord.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')

// NOTE: If you change this you also need to change the pre-defined images
//  and the addProvenance script
const tokensToMint = 20

// Using this mnemonic (DON'T USE IN PRODUCTION!):
// candy maple cake sugar pudding cream honey rich smooth crumble sweet treat
const ganachePrivateKeys = [
  'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
]

const additionalDataDelimeter = '::'
const encodeAdditionalData = (additionalData) => {
  return `0x${Buffer.from(additionalData.join(additionalDataDelimeter)).toString('hex')}`
}

// Not perfect, but good enough for testing purposes
const getTokenName = (tokenIndex) => {
  let prefix

  switch (tokenIndex) {
    case 0:
      prefix = 'Genesis'
      break

    case 1:
      prefix = '1st'
      break

    case 2:
      prefix = '2nd'
      break

    case 3:
      prefix = '3rd'
      break

    default:
      prefix = `${tokenIndex}th`
      break
  }

  return `${prefix} Token`
}

const fetchAuthTokens = () => {
  console.log('Grabbing auth tokens for minting')

  const authTokenRequests = []
  const personalMessageToSign = 'Please sign this message to authenticate with the Codex Registry.'

  for (let accountIndex = 0; accountIndex < ganachePrivateKeys.length; accountIndex++) {
    const msgHash = util.hashPersonalMessage(Buffer.from(personalMessageToSign))
    const signature = util.ecsign(msgHash, Buffer.from(ganachePrivateKeys[accountIndex], 'hex'))
    const signedData = util.toRpcSig(signature.v, signature.r, signature.s)
    const account = web3.eth.accounts[accountIndex]

    authTokenRequests.push(axios.post('/auth-token', {
      userAddress: account,
      signedData: signedData.substr(2),
    }))
  }

  return Promise.all(authTokenRequests)
}

const fetchImageRecord = (authToken) => {
  console.log('Grabbing images for minting')

  const requestOptions = {
    headers: {
      Authorization: authToken,
    },
  }

  return axios
    .post('/test/create-images', {}, requestOptions)
    .then((response) => {
      return response.data.result[0]
    })
}

const mintTokens = async (contract, authTokens) => {
  console.log('Minting some tokens for testing purposes')

  for (let tokenIndex = 0; tokenIndex < tokensToMint; tokenIndex++) {

    const accountIndex = tokenIndex % ganachePrivateKeys.length
    const account = web3.eth.accounts[accountIndex]
    const authToken = authTokens[accountIndex]

    // eslint-disable-next-line no-await-in-loop
    const imageRecord = await fetchImageRecord(authToken)

    const requestBody = {
      name: getTokenName(tokenIndex),
      description: `Description of ${getTokenName(tokenIndex)}`,
      mainImage: imageRecord,
    }

    const requestOptions = {
      headers: {
        Authorization: authToken,
      },
    }

    // eslint-disable-next-line no-await-in-loop
    await axios
      .post('/users/record-metadata', requestBody, requestOptions)
      .then((response) => {

        const { result } = response.data

        if (!result) {
          throw new Error(`could not create metadata: ${response}`)
        }

        console.log(`Minting ${result.name}`)

        return contract.mint(
          account,
          web3.sha3(result.name),
          web3.sha3(result.description),
          [result.mainImage.hash], // instead of downloading the file, reading it as binary data, and hashing that - we'll just use the hash created by the API since they should produce the same hash anyway
          encodeAdditionalData([process.env.METADATA_PROVIDER_ID, result.id]),
        )

      })
      .catch((error) => {
        console.log(error)
      })
  }
}

module.exports = async (callback) => {
  const codexRecordProxy = await CodexRecordProxy.deployed()
  const codexRecord = CodexRecord.at(codexRecordProxy.address)

  axios.defaults.baseURL = 'http://localhost:3001'
  axios.defaults.headers.common['Content-Type'] = 'application/json'

  const authTokens = []
  const responses = await fetchAuthTokens()

  for (let i = 0; i < responses.length; i++) {
    authTokens.push(responses[i].data.result.token)
  }

  await mintTokens(codexRecord, authTokens)

  callback()
}
