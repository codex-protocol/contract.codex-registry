pragma solidity 0.4.24;

import "./CodexStakeContractInterface.sol";
import "./ERC900/ERC900CreditsStakeContract.sol";


/**
 * @title CodexStakeContract
 */
contract CodexStakeContract is CodexStakeContractInterface, ERC900CreditsStakeContract {

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
    ERC900BasicStakeContract(_stakingToken)
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
}
