pragma solidity ^0.4.24;

import "./ERC900/ERC900BasicStakeContainer.sol";
import "./library/Pausable.sol";


contract CodexStakeContainer is ERC900BasicStakeContainer, Pausable {
  constructor(ERC20 _stakingToken, uint256 _lockInDuration) public
    ERC900BasicStakeContainer(_stakingToken)
  {
    lockInDuration = _lockInDuration;
  }

  function setLockInDuration(uint256 _lockInDuration) external onlyOwner {
    lockInDuration = _lockInDuration;
  }
}
