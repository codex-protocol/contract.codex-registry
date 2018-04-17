const CodexTitle = artifacts.require('./CodexTitle.sol');
const TokenProxy = artifacts.require('./TokenProxy.sol');

module.exports = async function (deployer, network, accounts) {
  // TODO: Come up with a better place to define this. Maybe .env?
  let newOwner = '';
  switch (network) {
  case 'ganache':
    newOwner = accounts[1];
    break;

  case 'rinkeby':
    newOwner = '0xA7899114e93880A5790a68F9df66174FC038849a';
    break;

  default:
    throw new Error('No ownership transfer defined for this network');
  }

  // TODO: Should we transfer the ownership of CodexTItle itself too? Right now we are just transferring the proxy
  const tokenProxy = await TokenProxy.deployed();
  const codexTitle = CodexTitle.at(tokenProxy.address);

  codexTitle.transferOwnership(newOwner);
};
