pragma solidity 0.4.24;

import "../ERC900/ERC900CompoundingStakeContract.sol";


/**
 * @title CompoundingStakeContract
 */
contract CompoundingStakeContract is ERC900CompoundingStakeContract {
  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token used for staking
   * @param _lockInDuration uint256 The default duration (in seconds) that stakes are created with
   * @param _annualizedInterestRate uint256 The default interest rate to use (should be an integer)
   */
  constructor(
    ERC20 _stakingToken,
    uint256 _lockInDuration,
    uint256 _annualizedInterestRate
  )
    public
    ERC900BasicStakeContract(_stakingToken)
  {
    defaultLockInDuration = _lockInDuration;
    annualizedInterestRate = _annualizedInterestRate;
  }
}
