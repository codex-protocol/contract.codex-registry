pragma solidity 0.4.24;

import "./ERC900/ERC900BasicStakeContainer.sol";

import "./library/Ownable.sol";


/**
 * @title CodexStakeContainer
 */
contract CodexStakeContainer is ERC900BasicStakeContainer, Ownable {
  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token used for staking
   * @param _lockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
   * @param _annualizedInterestRate uint256 The interest rate (in wei) that stakes can receive on a yearly basis
   */
  constructor(ERC20 _stakingToken, uint256 _lockInDuration, uint256 _annualizedInterestRate) public
    ERC900BasicStakeContainer(_stakingToken)
  {
    lockInDuration = _lockInDuration;
    annualizedInterestRate = _annualizedInterestRate;
  }

  /**
   * @dev Sets the lockInDuration for stakes. Only callable by the owner
   * @param _lockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
   */
  function setLockInDuration(uint256 _lockInDuration) external onlyOwner {
    lockInDuration = _lockInDuration;
  }

  /**
   * @dev Sets the interest rate for the perceivedAmount on stakes. Only callable by the owner.
   * @param _annualizedInterestRate uint256 The annualized interest rate (in wei)
   */
  function setAnnualizedInterestRate(uint256 _annualizedInterestRate) external onlyOwner {
    annualizedInterestRate = _annualizedInterestRate;
  }
}
