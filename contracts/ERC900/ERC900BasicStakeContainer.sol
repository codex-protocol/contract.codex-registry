/* solium-disable security/no-block-members */
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

  // 3 months (in seconds), based on a 30 day month
  uint256 constant public DEFAULT_DURATION = 7776000;

  mapping (address => StakeContainer) public stakeHolders;

  struct Stake {
    uint256 lockedBlockTimestamp;
    uint256 unlockedBlockTimestamp;
    uint256 originalAmount;
    uint256 currentAmount;
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
    uint256 totalStakedFor;

    uint256 personalStakeIndex;

    Stake[] personalStakes;

    bool exists;
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

  // @TODO: These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
  function getPersonalStakeUnlockedBlockTimestamps(address _address) external view returns (uint256[]) {
    require(stakeHolders[_address].exists, "No stakes at that address");

    StakeContainer storage stakeContainer = stakeHolders[_address];

    uint256 arraySize = stakeContainer.personalStakes.length - stakeContainer.personalStakeIndex;
    uint256[] memory unlockedBlockTimestamps = new uint256[](arraySize);

    for (uint256 i = stakeContainer.personalStakeIndex; i < stakeContainer.personalStakes.length; i++) {
      unlockedBlockTimestamps[i] = stakeContainer.personalStakes[i].unlockedBlockTimestamp;
    }

    return unlockedBlockTimestamps;
  }

  // @TODO: These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
  function getPersonalStakeAmounts(address _address) external view returns (uint256[]) {
    require(stakeHolders[_address].exists, "No stakes at that address");

    StakeContainer storage stakeContainer = stakeHolders[_address];

    uint256 arraySize = stakeContainer.personalStakes.length - stakeContainer.personalStakeIndex;
    uint256[] memory amounts = new uint256[](arraySize);

    for (uint256 i = stakeContainer.personalStakeIndex; i < stakeContainer.personalStakes.length; i++) {
      amounts[i] = stakeContainer.personalStakes[i].currentAmount;
    }

    return amounts;
  }

  // @TODO: These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
  function getPersonalStakeForAddresses(address _address) external view returns (address[]) {
    require(stakeHolders[_address].exists, "No stakes at that address");

    StakeContainer storage stakeContainer = stakeHolders[_address];

    uint256 arraySize = stakeContainer.personalStakes.length - stakeContainer.personalStakeIndex;
    address[] memory stakedFor = new address[](arraySize);

    for (uint256 i = stakeContainer.personalStakeIndex; i < stakeContainer.personalStakes.length; i++) {
      stakedFor[i] = stakeContainer.personalStakes[i].stakedFor;
    }

    return stakedFor;
  }

  function stake(uint256 _amount, bytes _data) public {
    createStake(
      msg.sender,
      _amount,
      DEFAULT_DURATION,
      _data);
  }

  function stakeFor(address _user, uint256 _amount, bytes _data) public {
    createStake(
      _user,
      _amount,
      DEFAULT_DURATION,
      _data);
  }

  function unstake(uint256 _amount, bytes _data) public {
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[stakeHolders[msg.sender].personalStakeIndex];

    // Check that the current stake has unlocked & matches the unstake amount
    // @TODO: This can be improved by looking at all staked tokens as opposed to the current stake,
    //  but that makes things more complicated to keep track of. Suggest we leave it like this for now.
    require(
      personalStake.unlockedBlockTimestamp <= block.timestamp,
      "The current stake hasn't unlocked yet");

    require(
      personalStake.currentAmount == _amount,
      "The current stake doesn't match the unstake amount");

    // Transfer the staked tokens from this contract back to the sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed beforehand.
    require(
      stakingToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    stakeHolders[personalStake.stakedFor].totalStakedFor = stakeHolders[personalStake.stakedFor].totalStakedFor.sub(personalStake.currentAmount);
    personalStake.currentAmount = 0;
    stakeHolders[msg.sender].personalStakeIndex++;

    emit Unstaked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  function totalStakedFor(address _address) public view returns (uint256) {
    return stakeHolders[_address].totalStakedFor;
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

  function createStake(
    address _address,
    uint256 _amount,
    uint256 _duration,
    bytes _data)
    internal
    canStake(msg.sender, _amount)
  {
    if (!stakeHolders[msg.sender].exists) {
      stakeHolders[msg.sender].exists = true;
    }

    stakeHolders[_address].totalStakedFor = stakeHolders[_address].totalStakedFor.add(_amount);
    stakeHolders[msg.sender].personalStakes.push(
      Stake(
        block.timestamp,
        block.timestamp.add(_duration),
        _amount,
        _amount,
        _address,
        true)
      );

    emit Staked(
      _address,
      _amount,
      totalStakedFor(_address),
      _data);
  }
}
