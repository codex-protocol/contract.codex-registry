pragma solidity ^0.4.24;


/**
 * @title Migrations
 * @dev Truffle migrations contract, used for deployment only
 */
contract Migrations {
  address public owner;
  uint256 public lastCompletedMigration;

  modifier restricted() {
    if (msg.sender == owner)
      _;
  }

  constructor() public {
    owner = msg.sender;
  }

  function setCompleted(uint256 _completed) public restricted {
    lastCompletedMigration = _completed;
  }

  function upgrade(address _newAddress) public restricted {
    Migrations upgraded = Migrations(_newAddress);
    upgraded.setCompleted(lastCompletedMigration);
  }
}
