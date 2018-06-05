pragma solidity ^0.4.24;

import "./ERC900BasicStakeContainer.sol";
import "../library/Pausable.sol";


contract CodexStakeContainer is ERC900BasicStakeContainer, Pausable {
  constructor(ERC20 _stakingToken, uint256 _defaultDuration) public
    ERC900BasicStakeContainer(_stakingToken)
  {
    defaultDuration = _defaultDuration;
  }

  function setDefaultDuration(uint256 _defaultDuration) external onlyOwner {
    defaultDuration = _defaultDuration;
  }
}
