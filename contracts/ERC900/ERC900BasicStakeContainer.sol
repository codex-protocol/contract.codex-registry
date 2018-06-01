pragma solidity ^0.4.24;

import "./ERC900.sol";
import "../ERC20/ERC20.sol";

import "../library/SafeMath.sol";


/**
 * @title ERC900BasicStakeContainer
 */
contract ERC900BasicStakeContainer is ERC900 {
  // @TODO: deploy this separately so we don't have to deploy it multiple times for each contract
  using SafeMath for uint256;

  ERC20 stakingToken;

  mapping (address => StakeContainer) public addresses;

  struct Stake {
    uint256 blockNumber;
    uint256 amount;
    address stakedFor;
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
    // @TODO: This data structure should change to represent "weight" instead of amount
    uint256 amountStakedFor;

    Stake personalStake;

    bool exists;
  }

  modifier canStake(address _address, uint256 _amount) {
    require(
      !addresses[_address].personalStake.exists,
      "Stake already exists");

    require(
      stakingToken.transferFrom(_address, this, _amount),
      "Stake required");

    _;
  }

  constructor(ERC20 _stakingToken) public {
    stakingToken = _stakingToken;
  }

  function stake(uint256 _amount, bytes _data) public {
    createStake(msg.sender, _amount, _data);
  }

  function stakeFor(address _user, uint256 _amount, bytes _data) public {
    createStake(_user, _amount, _data);
  }

  function unstake(uint256 _amount, bytes _data) public {
    require(addresses[msg.sender].personalStake.exists, "Stake doesn't exist");

    // Transfer the staked tokens from this contract back to the sender
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
      addresses[msg.sender].personalStake.amount = addresses[msg.sender].personalStake.amount.sub(_amount);
      addresses[msg.sender].amountStakedFor = addresses[msg.sender].amountStakedFor.sub(_amount);
    }

    emit Unstaked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  // @TODO: These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
  function getPersonalStakeBlockNumber(address _address) public view returns (uint256) {
    return addresses[_address].personalStake.blockNumber;
  }

  // @TODO: These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
  function getPersonalStakeAmount(address _address) public view returns (uint256) {
    return addresses[_address].personalStake.amount;
  }

  // @TODO: These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
  function getPersonalStakeFor(address _address) public view returns (address) {
    return addresses[_address].personalStake.stakedFor;
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

  function createStake(address _address, uint256 _amount, bytes _data)
    private
    canStake(msg.sender, _amount)
  {
    if (!addresses[msg.sender].exists) {
      addresses[msg.sender] = StakeContainer(
        0,
        Stake(
          block.number,
          _amount,
          _address,
          true),
        true
      );
    } else {
      addresses[msg.sender].personalStake = Stake(
        block.number,
        _amount,
        _address,
        true);
    }

    addresses[_address].amountStakedFor = addresses[_address].amountStakedFor.add(_amount);

    emit Staked(
      _address,
      _amount,
      totalStakedFor(_address),
      _data);
  }
}
