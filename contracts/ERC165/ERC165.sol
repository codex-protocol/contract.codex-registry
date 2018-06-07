pragma solidity 0.4.24;


/**
 * @dev A standard for detecting smart contract interfaces.
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
 */
contract ERC165 {

  // bytes4(keccak256('supportsInterface(bytes4)'));
  bytes4 constant INTERFACE_ERC165 = 0x01ffc9a7;

  /**
   * @dev Checks if the smart contract includes a specific interface.
   * @param _interfaceID The interface identifier, as specified in ERC-165.
   */
  function supportsInterface(bytes4 _interfaceID) public pure returns (bool) {
    return _interfaceID == INTERFACE_ERC165;
  }
}
