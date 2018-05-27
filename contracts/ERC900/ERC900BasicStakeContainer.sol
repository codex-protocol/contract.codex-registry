pragma solidity ^0.4.24;

import "./ERC900.sol";
import "../ERC20/ERC20.sol";

import "../library/SafeMath.sol";

/**
 * @title ERC900BasicStakeContainer
 */
contract ERC900BasicStakeContainer is ERC900 {
  using SafeMath for uint256;

  ERC20 stakingToken;

  mapping (address => Stake) stakes;

  // TODO: This data structure should change to represent "weight" instead of amount
  mapping (address => uint256) amountStakedFor;

  struct Stake {
    uint256 blockNumber;
    uint256 amount;
    bool exists;
  }

  constructor(ERC20 _stakingToken) public {
    stakingToken = _stakingToken;
  }

  function stake(uint256 _amount, bytes _data) public {
    require(!stakes[msg.sender].exists, "Stake already exists");

    require(
      stakingToken.transferFrom(msg.sender, this, _amount),
      "Stake required");

    stakes[msg.sender] = Stake(block.number, _amount, true);
    amountStakedFor[msg.sender].add(_amount);

    emit Staked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  function stakeFor(address _user, uint256 _amount, bytes _data) public {
    require(!stakes[msg.sender].exists, "Stake already exists");

    require(
      stakingToken.transferFrom(msg.sender, this, _amount),
      "Stake required");

    stakes[msg.sender] = Stake(block.number, _amount, true);

    // Notice here that we are increasing the staked amount for _user
    //  instead of msg.sender
    amountStakedFor[_user].add(_amount);

    emit Staked(
      _user,
      _amount,
      totalStakedFor(_user),
      _data);
  }

  function unstake(uint256 _amount, bytes _data) public {
    require(stakes[msg.sender].exists, "Stake doesn't exist");

    // Transfer the staked tokens from this contract back tot he sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed before hand.
    require(
      stakingToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    // If this was a complete withdrawal, then delete the previous stake to reset
    //  the block number and exists flag
    if (stakes[msg.sender].amount == 0) {
      delete stakes[msg.sender];
      amountStakedFor[msg.sender] = 0;
    } else {
      amountStakedFor[msg.sender].sub(_amount);
    }

    emit Unstaked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  function totalStakedFor(address _address) public view returns (uint256) {
    return amountStakedFor[_address];
  }

  function totalStaked() public view returns (uint256) {
    return stakingToken.balanceOf(this);
  }

  function token() public view returns (address) {
    return stakingToken;
  }
}
