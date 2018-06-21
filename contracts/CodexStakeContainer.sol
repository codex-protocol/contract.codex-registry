pragma solidity 0.4.24;

import "./CodexStakeContainerInterface.sol";
import "./ERC900/ERC900BasicStakeContainer.sol";

import "./library/Ownable.sol";


/**
 * @title CodexStakeContainer
 */
contract CodexStakeContainer is CodexStakeContainerInterface, ERC900BasicStakeContainer, Ownable {

  mapping (address => uint256) creditBalances;

  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token used for staking
   * @param _defaultLockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
   */
  constructor(
    ERC20 _stakingToken,
    uint256 _defaultLockInDuration
  )
    public
    ERC900BasicStakeContainer(_stakingToken)
  {
    defaultLockInDuration = _defaultLockInDuration;
  }

  /**
   * @dev Sets the lockInDuration for stakes. Only callable by the owner
   * @param _defaultLockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
   */
  function setDefaultLockInDuration(
    uint256 _defaultLockInDuration
  )
    external
    onlyOwner
  {
    defaultLockInDuration = _defaultLockInDuration;
  }

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

    uint256 creditsAwarded = calculateCreditAward(_amount, defaultLockInDuration);
    creditBalances[msg.sender] = creditBalances[msg.sender].add(creditsAwarded);
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

    uint256 creditsAwarded = calculateCreditAward(_amount, defaultLockInDuration);
    creditBalances[_user] = creditBalances[_user].add(creditsAwarded);
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
      _lockInDuration,
      _data);

    uint256 creditsAwarded = calculateCreditAward(_amount, _lockInDuration);
    creditBalances[_user] = creditBalances[_user].add(creditsAwarded);
  }

  function calculateCreditAward(
    uint256 _amount,
    uint256 _lockInDuration
  )
    internal
    pure
    returns (uint256)
  {
    // @TODO: Obviously not final, but insert math here.
    return _amount * _lockInDuration;
  }
}
