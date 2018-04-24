const TokenProxy = artifacts.require('./TokenProxy.sol');

module.exports = function (deployer) {
  deployer.deploy(TokenProxy);
};
