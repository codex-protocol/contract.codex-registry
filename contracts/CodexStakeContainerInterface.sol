pragma solidity 0.4.24;

import "./ERC900/ERC900.sol";


contract CodexStakeContainerInterface is ERC900 {
  // @TODO: Worth having an event for credit spend?
  // Probably not since there are events taking place in the registry contract

  function stakeForDuration(
    address user,
    uint256 amount,
    uint256 lockInDuration,
    bytes data) public;

  // @TODO, we need authorization from the contract here (modifier)
  function spendCredits(address user, uint256 amount) public;
  function creditBalanceOf(address user) public view returns (uint256);
}
