const CodexTitle = artifacts.require('./CodexTitle.sol');
const TokenProxy = artifacts.require('./TokenProxy.sol');

module.exports = async function (deployer) {
  const codexTitle = await CodexTitle.deployed();
  const tokenProxy = await TokenProxy.deployed();

  console.log('Upgrading TokenProxy to point at CodexTitle');

  tokenProxy.upgradeTo('1', codexTitle.address);
};
