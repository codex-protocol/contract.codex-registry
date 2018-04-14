const CodexTitle = artifacts.require('./CodexTitle.sol');
// const Delegation = artifacts.require('./Delegation.sol');

module.exports = function (deployer) {
  /*
  deployer.deploy(CodexTitle).then(() => {
    return deployer.deploy(Delegation, CodexTitle.address);
  }).catch((error) => {
    console.log(error);
  });
  */

  deployer.deploy(CodexTitle);
};
