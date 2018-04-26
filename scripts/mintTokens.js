const axios = require('axios');
const util = require('ethereumjs-util');

const CodexTitle = artifacts.require('./CodexTitle.sol');
const TokenProxy = artifacts.require('./TokenProxy.sol');

const tokensToMint = 20;
const ganachePrivateKeys = [
  'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
];

module.exports = async function (callback) {
  const tokenProxy = await TokenProxy.deployed();
  const codexTitle = CodexTitle.at(tokenProxy.address);

  axios.defaults.baseURL = 'http://localhost:3001';
  axios.defaults.headers.common['Content-Type'] = 'application/json';

  const authTokens = [];
  const responses = await fetchAuthTokens();

  for (let i = 0; i < responses.length; i++) {
    authTokens.push(responses[i].data.result.token);
  }

  const imageRecords = await fetchImageRecords(authTokens[0]);

  await mintTokens(codexTitle, authTokens, imageRecords);

  callback();
};

function fetchAuthTokens () {
  console.log('Grabbing auth tokens for minting');

  const authTokenRequests = [];
  const personalMessageToSign = 'Please sign this message to authenticate with the Codex Title Registry.';

  for (let accountIndex = 0; accountIndex < ganachePrivateKeys.length; accountIndex++) {
    const msgHash = util.hashPersonalMessage(Buffer.from(personalMessageToSign));
    const signature = util.ecsign(msgHash, Buffer.from(ganachePrivateKeys[accountIndex], 'hex'));
    const signedData = util.toRpcSig(signature.v, signature.r, signature.s);
    const account = web3.eth.accounts[accountIndex];

    authTokenRequests.push(axios.post('/auth-token', {
      userAddress: account,
      signedData: signedData.substr(2),
    }));
  }

  return Promise.all(authTokenRequests);
}

function fetchImageRecords (authToken) {
  console.log('Grabbing images for minting');

  return axios
    .post(`/test/create-images/${tokensToMint}`, {}, { headers: { 'Authorization': authToken } })
    .then((response) => {
      return response.data.result;
    });
}

function mintTokens (contract, authTokens, imageRecords) {
  console.log('Minting some tokens for testing purposes');

  const metadataRequests = [];

  for (let tokenIndex = 0; tokenIndex < tokensToMint; tokenIndex++) {
    const accountIndex = tokenIndex % ganachePrivateKeys.length;
    const account = web3.eth.accounts[accountIndex];

    metadataRequests.push(axios.post('/users/titles/metadata', {
      name: getTokenName(tokenIndex),
      description: `Description of ${getTokenName(tokenIndex)}`,
      files: [imageRecords[tokenIndex]] || undefined,
    }, { headers: { 'Authorization': authTokens[accountIndex] },
    }).then((response) => {
      const result = response.data.result;
      if (result) {
        console.log(`Minting ${result.name}`);

        return contract.mint(
          account,
          web3.sha3(result.name),
          web3.sha3(result.description),
          web3.sha3('image data'),
          '1',
          result.id,
        );
      }
    }).catch((error) => {
      console.log(error);
    }));
  }

  return Promise.all(metadataRequests);
}

// Not perfect, but good enough for testing purposes
function getTokenName (tokenIndex) {
  let prefix;

  switch (tokenIndex) {
  case 0:
    prefix = 'Genesis';
    break;

  case 1:
    prefix = '1st';
    break;

  case 2:
    prefix = '2nd';
    break;

  case 3:
    prefix = '3rd';
    break;

  default:
    prefix = `${tokenIndex}th`;
    break;
  }

  return `${prefix} Token`;
}
