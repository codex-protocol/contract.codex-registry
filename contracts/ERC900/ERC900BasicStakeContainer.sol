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

  mapping (address => StakeContainer) addresses;

  struct Stake {
    uint256 blockNumber;
    uint256 amount;
    bool exists;
  }

  // To save on gas, rather than create a separate mapping for amountStakedFor & personalStake,
  //  both data structures are stored in a single mapping for a given addresses.
  //
  // amountStakedFor consists of all tokens staked for a given address.
  // personalStake is the stake made by a given address.
  //
  // It's possible to have a non-existing personalStake, but have tokens in amountStakedFor
  //  if other users are staking on behalf of a given address.
  struct StakeContainer {
    // TODO: This data structure should change to represent "weight" instead of amount
    uint256 amountStakedFor;

    Stake personalStake;
  }

  modifier noExistingStake(address _address) {
    require(
      !addresses[_address].personalStake.exists,
      "Stake already exists");
    _;
  }

  modifier canStake(address _address, uint256 _amount) {
    require(
      stakingToken.transferFrom(_address, this, _amount),
      "Stake required");
    _;
  }

  constructor(ERC20 _stakingToken) public {
    stakingToken = _stakingToken;
  }

  function stake(uint256 _amount, bytes _data)
    public
    noExistingStake(msg.sender)
    canStake(msg.sender, _amount)
  {
    addresses[msg.sender].personalStake = Stake(block.number, _amount, true);
    addresses[msg.sender].amountStakedFor.add(_amount);

    emit Staked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  function stakeFor(address _user, uint256 _amount, bytes _data)
    public
    noExistingStake(msg.sender)
    canStake(msg.sender, _amount)
  {
    addresses[msg.sender].personalStake = Stake(block.number, _amount, true);

    // Notice here that we are increasing the staked amount for _user
    //  instead of msg.sender
    addresses[_user].amountStakedFor.add(_amount);

    emit Staked(
      _user,
      _amount,
      totalStakedFor(_user),
      _data);
  }

  function unstake(uint256 _amount, bytes _data) public {
    require(addresses[msg.sender].personalStake.exists, "Stake doesn't exist");

    // Transfer the staked tokens from this contract back tot he sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed before hand.
    require(
      stakingToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    // If this was a complete withdrawal, then delete the previous stake to reset
    //  the block number and exists flag
    if (addresses[msg.sender].personalStake.amount == 0) {
      delete addresses[msg.sender].personalStake;
      addresses[msg.sender].amountStakedFor = 0;
    } else {
      addresses[msg.sender].amountStakedFor.sub(_amount);
    }

    emit Unstaked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  function totalStakedFor(address _address) public view returns (uint256) {
    return addresses[_address].amountStakedFor;
  }

  function totalStaked() public view returns (uint256) {
    return stakingToken.balanceOf(this);
  }

  function token() public view returns (address) {
    return stakingToken;
  }

  function supportsHistory() public pure returns (bool) {
    return false;
  }
}
