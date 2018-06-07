pragma solidity ^0.4.24;


/**
 * @title Debuggable, a utility contract to assist in debugging
 * @notice FOR LOCAL DEVELOPMENT ONLY!
 * @dev provides a bunch of events that can be emitted in smart contracts to aid in debugging.
 *  Think of it like console.log for Solidity.
 * @dev Fill in new data types as needed.
 */
contract Debuggable {
  event DebugUint256(uint256 value);
  event DebugString(string value);
  event DebugAddress(address value);
}
