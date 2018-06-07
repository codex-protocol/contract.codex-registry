pragma solidity ^0.4.24;

import "./ERC900/ERC900BasicStakeContainer.sol";

// @TODO: Add Pausable functionality to prevent staking/unstaking?
import "./library/Pausable.sol";


/**
 * @title CodexStakeContainer
 */
contract CodexStakeContainer is ERC900BasicStakeContainer, Pausable {
  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token used for staking
   * @param _lockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
   */
  constructor(ERC20 _stakingToken, uint256 _lockInDuration) public
    ERC900BasicStakeContainer(_stakingToken)
  {
    lockInDuration = _lockInDuration;
  }

  /**
   * @dev Sets the lockInDuration for stakes. Only callable by the owner
   * @param _lockInDuration uint256 The duration (in seconds) that stakes are required to be locked for
   */
  function setLockInDuration(uint256 _lockInDuration) external onlyOwner {
    lockInDuration = _lockInDuration;
  }
}
