const axios = require('axios');
const util = require('ethereumjs-util');

const CodexTitle = artifacts.require('./CodexTitle.sol');
const TokenProxy = artifacts.require('./TokenProxy.sol');

const tokensToMint = 20;
const ganachePrivateKeys = [
  'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
];

const imageUris = [
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721150.acf864c7-e3dc-4acf-8291-9576812aca4b.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721157.16124903-7695-4a49-a633-a3d58579955e.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721162.939eb319-e5a8-4526-978d-2ad653c25768.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721165.226d021c-8919-4fbd-9bd5-5433f2c8419a.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721175.c5e98c7c-336c-4a23-96c4-874e396b8c87.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721179.ff65f3bd-d958-480a-bcb2-72ec00193322.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721181.650df22a-07cc-41ea-9e5d-e0f45024e2ee.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721186.1d48ba26-452c-437b-9938-a6f0110c9a38.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721193.270fe65e-b729-429e-8460-c9ce1cf02067.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721195.cb0986a4-8354-4e55-ac87-d6867d61cace.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721196.65c090a3-0fe5-4ac9-a291-89832561efc4.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721198.955d53d8-5254-4e50-84a4-99ccd4ef272b.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721199.d699a110-9052-425e-8d09-b80b43fa1132.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721200.4c256c08-b4c2-47c3-95ff-fd89a2dbc434.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721205.345776d5-ca17-48c5-b318-c155e0c02eb3.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721207.ac1be226-fe37-4cb2-9925-0ae30eac22fc.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721209.fa544c2e-cfb2-4c3c-b86a-ddcb492add87.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721210.0394e31d-90fe-407c-8498-1d604b019c6a.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721210.93dfbce7-12a5-450d-b066-7040647cf37e.jpg',
  'https://s3.amazonaws.com/codex.title-registry/development/users/0xf17f52151ebef6c7334fad080c5704d77216b732/files/1524684721212.84ff1dc9-9395-4250-9073-6bec453c0a2e.jpg',
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

  await mintTokens(codexTitle, authTokens);

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

function mintTokens (contract, authTokens) {
  console.log('Minting some tokens for testing purposes');

  const metadataRequests = [];
  for (let tokenIndex = 0; tokenIndex < tokensToMint; tokenIndex++) {
    const accountIndex = tokenIndex % ganachePrivateKeys.length;
    const account = web3.eth.accounts[accountIndex];

    metadataRequests.push(axios.post('/users/titles/metadata', {
      name: getTokenName(tokenIndex),
      description: `Description of ${getTokenName(tokenIndex)}`,
      imageUri: imageUris[tokenIndex] || undefined,
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
