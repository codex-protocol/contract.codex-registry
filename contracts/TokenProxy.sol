pragma solidity ^0.4.21;

import "./zeppelin-solidity/Ownable.sol";


contract TokenProxy is Ownable {
  event Upgraded(string version, address indexed implementation);

  string internal version;
  address internal implementation;

  function () payable public {
    address _impl = implementation;
    require(_impl != address(0));

    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize)
      let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }

  function upgradeTo(string _version, address _implementation) external onlyOwner {
    require(_implementation != implementation);

    version = _version;
    implementation = _implementation;

    emit Upgraded(version, implementation);
  }
}