pragma solidity ^0.4.24;

import "./ERC900BasicStakeContract.sol";

import "../library/Ownable.sol";


/**
 * @title ERC900 Credits-based staking implementation
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-900.md
 *
 * Notice that credits aren't lost when tokens are unstaked--only when credits are spent.
 * This means that after the initial lock in duration expires, a user can re-stake those tokens
 *  for more credits.
 * Another important note: spendCredits can only be called by the contract's owner. This
 *  is meant to be another smart contract. For example, the smart contract can offer call
 *  spendCredits to reduce a user's credit balance in place of spending real tokens.
 */
contract ERC900CreditsStakeContract is ERC900BasicStakeContract, Ownable {

  mapping (address => uint256) public creditBalances;

  function creditBalanceOf(
    address _user
  )
    public
    view
    returns (uint256)
  {
    return creditBalances[_user];
  }

  function spendCredits(
    address _user,
    uint256 _amount
  )
    public
    onlyOwner
  {
    require(
      creditBalances[_user] > _amount,
      "Insufficient balance");

    creditBalances[_user] = creditBalances[_user].sub(_amount);
  }

  function stake(
    uint256 _amount,
    bytes _data
  )
    public
  {
    super.stake(
      _amount,
      _data);

    updateCreditBalance(
      msg.sender,
      _amount,
      defaultLockInDuration);
  }

  function stakeFor(
    address _user,
    uint256 _amount,
    bytes _data
  )
    public
  {
    super.stakeFor(
      _user,
      _amount,
      _data);

    updateCreditBalance(
      _user,
      _amount,
      defaultLockInDuration);
  }

  function stakeForDuration(
    address _user,
    uint256 _amount,
    uint256 _lockInDuration,
    bytes _data
  )
    public
  {
    super.createStake(
      _user,
      _amount,
      _lockInDuration);

    updateCreditBalance(
      _user,
      _amount,
      _lockInDuration);

    emit Staked(
      _user,
      _amount,
      totalStakedFor(_user),
      _data);
  }

  function updateCreditBalance(
    address _user,
    uint256 _amount,
    uint256 _lockInDuration
  )
    internal
    returns (uint256)
  {
    // @TODO: Obviously not final, but insert math here.
    uint256 creditsAwarded = _amount * _lockInDuration;

    creditBalances[_user] = creditBalances[_user].add(creditsAwarded);
  }
}
