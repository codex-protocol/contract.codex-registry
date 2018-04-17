pragma solidity ^0.4.21;

import "./zeppelin-solidity/Ownable.sol";


/**
 * @title TokenProxy, a proxy contract for token storage
 * @dev This allows the token owner to optionally upgrade the token in the future
 *  if there are changes needed in the business logic. See the upgradeTo function
 *  for caveats.
 * See https://github.com/zeppelinos/labs/tree/master/upgradeability_using_inherited_storage
 */
contract TokenProxy is Ownable {
  event Upgraded(string version, address indexed implementation);

  string internal version;
  address internal implementation;

  /**
  * @dev Fallback function. Any transaction sent to this contract that doesn't match the
  *  upgradeTo signature will fallback to this function, which in turn will use
  *  DELEGATECALL to delegate the transaction data to the implementation.
  */
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

  /**
  * @dev Upgrades the TokenProxy to point at a new implementation. Only callable by the owner.
  *  Only upgrade the token after extensive testing has been done. The storage is append only.
  *  The new token must inherit from the previous token so the shape of the storage is maintained.
  * @param _version The version of the token
  * @param _implementation The address at which the implementation is available
  */
  function upgradeTo(string _version, address _implementation) external onlyOwner {
    require(_implementation != implementation);

    version = _version;
    implementation = _implementation;

    emit Upgraded(version, implementation);
  }
}