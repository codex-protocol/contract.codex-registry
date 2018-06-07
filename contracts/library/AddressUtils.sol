pragma solidity 0.4.24;


/**
 * @title Utility library of inline functions on addresses
 */
library AddressUtils {

  /**
   * @notice Returns whether there is code in the target address
   * @dev This function will return false if invoked during the constructor of a contract,
   *  as the code is not actually created until after the constructor finishes.
   * @param addr address address to check
   * @return whether there is code in the target address
   */
  function isContract(address addr) internal view returns (bool) {
    uint256 size;

    // solium-disable-next-line security/no-inline-assembly
    assembly { size := extcodesize(addr) }

    return size > 0;
  }
}
