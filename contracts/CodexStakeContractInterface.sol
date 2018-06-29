pragma solidity 0.4.24;

import "./ERC900/ERC900.sol";


contract CodexStakeContractInterface is ERC900 {

  function stakeForDuration(
    address user,
    uint256 amount,
    uint256 lockInDuration,
    bytes data)
    public;

  function spendCredits(
    address user,
    uint256 amount)
    public;

  function creditBalanceOf(
    address user)
    public
    view
    returns (uint256);
}
