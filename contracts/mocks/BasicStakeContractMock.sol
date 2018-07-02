pragma solidity 0.4.24;

import "../ERC900/ERC900BasicStakeContract.sol";


/**
 * @title BasicStakeContractMock
 */
contract BasicStakeContractMock is ERC900BasicStakeContract {
  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token used for staking
   * @param _lockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
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
