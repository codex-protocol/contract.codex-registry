pragma solidity ^0.4.23;

import "./zeppelin-solidity/Ownable.sol";
import "./ERC721/ERC721.sol";


/**
 * @title CodexTitleProxy, a proxy contract for token storage
 * @dev This allows the token owner to optionally upgrade the token in the future
 *  if there are changes needed in the business logic. See the upgradeTo function
 *  for caveats.
 * See https://github.com/zeppelinos/labs/tree/master/upgradeability_using_inherited_storage
 */
contract CodexTitleProxy is Ownable {
  event Upgraded(string version, address indexed implementation);

  string public version;
  address public implementation;

  constructor(address _implementation) public {
    upgradeTo("1", _implementation);
  }

  /**
  * @dev Fallback function. Any transaction sent to this contract that doesn't match the
  *  upgradeTo signature will fallback to this function, which in turn will use
  *  DELEGATECALL to delegate the transaction data to the implementation.
  */
  function () payable public {
    address _implementation = implementation;

    // solium-disable-next-line security/no-inline-assembly
    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize)
      let result := delegatecall(gas, _implementation, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }

  /**
  * @dev Since name is passed into the ERC721 token constructor, it's not stored in the CodexTitleProxy
  *  contract. Thus, we call into the contract directly to retrieve its value.
  * @return string The name of the token
  */
  function name() external view returns (string) {
    ERC721Metadata tokenMetadata = ERC721Metadata(implementation);

    return tokenMetadata.name();
  }

  /**
  * @dev Since symbol is passed into the ERC721 token constructor, it's not stored in the CodexTitleProxy
  *  contract. Thus, we call into the contract directly to retrieve its value.
  * @return string The symbol of token
  */
  function symbol() external view returns (string) {
    ERC721Metadata tokenMetadata = ERC721Metadata(implementation);

    return tokenMetadata.symbol();
  }

  /**
  * @dev Upgrades the CodexTitleProxy to point at a new implementation. Only callable by the owner.
  *  Only upgrade the token after extensive testing has been done. The storage is append only.
  *  The new token must inherit from the previous token so the shape of the storage is maintained.
  * @param _version The version of the token
  * @param _implementation The address at which the implementation is available
  */
  function upgradeTo(string _version, address _implementation) public onlyOwner {

    // TODO: Add error messages for these
    require(keccak256(_version) != keccak256(version));
    require(_implementation != implementation);
    require(_implementation != address(0));

    version = _version;
    implementation = _implementation;

    emit Upgraded(version, implementation);
  }
}
