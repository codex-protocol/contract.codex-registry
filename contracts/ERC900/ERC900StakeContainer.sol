pragma solidity ^0.4.24;

import "./ERC900BasicStakeContainer.sol";


/**
 * @title ERC900StakeContainer
 */
contract ERC900StakeContainer is ERC900BasicStakeContainer {
  constructor(ERC20 _stakingToken) public
    ERC900BasicStakeContainer(_stakingToken) {
  }


  function supportsHistory() public pure returns (bool) {
    return true;
  }

  /*
  function lastStakedFor(address addr) public view returns (uint256) {

  }

  function totalStakedForAt(address addr, uint256 blockNumber) public view returns (uint256) {

  }

  function totalStakedAt(uint256 blockNumber) public view returns (uint256) {

  }
  */
}
