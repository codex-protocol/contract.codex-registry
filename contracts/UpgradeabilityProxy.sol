pragma solidity ^0.4.21;

import "./zeppelin-solidity/Ownable.sol";
import "./Proxy.sol";
import "./UpgradeabilityStorage.sol";


contract UpgradeabilityProxy is Ownable, Proxy, UpgradeabilityStorage {
  event Upgraded(string version, address indexed implementation);

  function upgradeTo(string version, address implementation) external onlyOwner {
    require(_implementation != implementation);
    _version = version;
    _implementation = implementation;
    emit Upgraded(version, implementation);
  }
}