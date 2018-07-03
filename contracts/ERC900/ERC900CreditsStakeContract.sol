pragma solidity 0.4.24;

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

  // NOTE: Credits do not have decimal places
  // Users cannot own fractional credits
  mapping (address => uint256) public creditBalances;

  /**
   * @dev Returns the balance of credits at a user's address.
   * @param _user address The address to check.
   * @return uint256 The credit balance.
   */
  function creditBalanceOf(
    address _user
  )
    public
    view
    returns (uint256)
  {
    return creditBalances[_user];
  }

  /**
   * @dev Spends credits for a user. Only callable by the owner. Reverts if the
   *  user doesn't have enough credits.
   * @param _user address The address that owns the credits being spent.
   * @param _amount uint256 The number of credits to spend.
   */
  function spendCredits(
    address _user,
    uint256 _amount
  )
    public
    onlyOwner
  {
    require(
      creditBalances[_user] >= _amount,
      "Insufficient balance");

    creditBalances[_user] = creditBalances[_user].sub(_amount);
  }

  /**
   * @dev Stakes tokens for the caller and rewards them with credits. Reverts
   *  if less than 1 token is being staked.
   * @param _amount uint256 The number of tokens to stake
   * @param _data bytes optional data to include in the Stake event
   */
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

  /**
   * Stakes tokens from the caller for a particular user, and rewards that user with credits.
   * Reverts if less than 1 token is being staked.
   * @param _user address The address the tokens are staked for
   * @param _amount uint256 The number of tokens to stake
   * @param _data bytes optional data to include in the Stake event
   */
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

  /**
   * @dev Stakes tokens from the caller for a given user & duration, and rewards that user with credits.
   * Reverts if less than 1 token is being staked, or if the duration specified is less than the default.
   * @param _user address The address the tokens are staked for
   * @param _amount uint256 The number of tokens to stake
   * @param _lockInDuration uint256 The duration (in seconds) that the stake should be locked for
   * @param _data bytes optional data to be included in the Stake event
   */
  function stakeForDuration(
    address _user,
    uint256 _amount,
    uint256 _lockInDuration,
    bytes _data
  )
    public
  {
    require(
      _lockInDuration >= defaultLockInDuration,
      "Insufficient stake duration");

    super.createStake(
      _user,
      _amount,
      _lockInDuration,
      _data);

    updateCreditBalance(
      _user,
      _amount,
      _lockInDuration);
  }

  /**
   * @dev Internal function to update the credit balance of a user when staking tokens.
   *  Users are rewarded with more tokens the longer they stake for.
   * @param _user address The address to award credits to
   * @param _amount uint256 The number of tokens being staked
   * @param _lockInDuration uint256 The duration (in seconds) that the stake should be locked for
   */
  function updateCreditBalance(
    address _user,
    uint256 _amount,
    uint256 _lockInDuration
  )
    internal
  {
    uint256 divisor = 1 ether;

    require(
      _amount >= divisor,
      "Insufficient amount");

    // NOTE: Truncation is intentional here
    // If a user stakes for less than the minimum duration, they are awarded with 0 credits
    // If they stake 2x the minimum duration, they are awarded with 2x credits
    // etc.
    uint256 rewardMultiplier = _lockInDuration / defaultLockInDuration;

    uint256 creditsAwarded = _amount.mul(rewardMultiplier).div(divisor);
    creditBalances[_user] = creditBalances[_user].add(creditsAwarded);
  }
}
