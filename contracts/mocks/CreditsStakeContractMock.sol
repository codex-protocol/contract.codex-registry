pragma solidity 0.4.24;

import "../ERC900/ERC900CreditsStakeContract.sol";


/**
 * @title CreditsStakeContract
 */
contract CreditsStakeContract is ERC900CreditsStakeContract {
  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token used for staking
   * @param _lockInDuration uint256 The default duration (in seconds) that stakes are created with
   */
  constructor(
    ERC20 _stakingToken,
    uint256 _lockInDuration
  )
    public
    ERC900BasicStakeContract(_stakingToken)
  {
    defaultLockInDuration = _lockInDuration;
  }
}
