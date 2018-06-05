/* solium-disable security/no-block-members */
pragma solidity ^0.4.24;

import "./ERC900.sol";
import "../ERC20/ERC20.sol";

import "../library/SafeMath.sol";


/**
 * @title ERC900 Simple Staking Interface basic implementation
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-900.md
 */
contract ERC900BasicStakeContainer is ERC900 {
  // @TODO: deploy this separately so we don't have to deploy it multiple times for each contract
  using SafeMath for uint256;

  // Token used for staking
  ERC20 stakingToken;

  // The duration of stake lock-in (in seconds)
  uint256 public lockInDuration;

  // To save on gas, rather than create a separate mapping for amountStakedFor & personalStake,
  //  both data structures are stored in a single mapping for a given addresses.
  //
  // totalStakedFor consists of all tokens staked for a given address.
  // personalStake is the stake made by a given address.
  //
  // It's possible to have a non-existing personalStake, but have tokens in amountStakedFor
  //  if other users are staking on behalf of a given address.
  mapping (address => StakeContainer) public stakeHolders;

  // Struct for personal stakes (i.e., stakes made by this address)
  // unlockedTimestamp - when the stake unlocks (in seconds since Unix epoch)
  // amount - the amount of tokens in the stake
  // stakedFor - the address the stake was staked for
  struct Stake {
    uint256 unlockedTimestamp;
    uint256 amount;
    address stakedFor;
  }

  // Struct for all stake metadata at a particular address
  // totalStakedFor - the number of tokens staked for this address
  // personalStakeIndex - the index in the personalStakes array.
  // personalStakes - append only array of stakes made by this address
  // exists - whether or not there are stakes that involve this address
  struct StakeContainer {
    uint256 totalStakedFor;

    uint256 personalStakeIndex;

    Stake[] personalStakes;

    bool exists;
  }

  /**
   * @dev Modifier that checks that this contract can transfer tokens from the
   *  balance in the stakingToken contract for the given address.
   * @dev This modifier also transfers the tokens.
   * @param _address address to transfer tokens from
   * @param _amount uint256 the number of tokens
   */
  modifier canStake(address _address, uint256 _amount) {
    require(
      stakingToken.transferFrom(_address, this, _amount),
      "Stake required");

    _;
  }

  /**
   * @dev Constructor function
   * @param _stakingToken ERC20 The address of the token contract used for staking
   */
  constructor(ERC20 _stakingToken) public {
    stakingToken = _stakingToken;
  }

  /**
   * @dev Returns the timestamps for when active personal stakes for an address will unlock
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return uint256[] array of timestamps
   */
  function getPersonalStakeUnlockedTimestamps(address _address) external view returns (uint256[]) {
    uint256[] memory timestamps;
    (timestamps,,) = getPersonalStakes(_address);

    return timestamps;
  }

  /**
   * @dev Returns the stake amounts for active personal stakes for an address
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return uint256[] array of amounts
   */
  function getPersonalStakeAmounts(address _address) external view returns (uint256[]) {
    uint256[] memory amounts;
    (,amounts,) = getPersonalStakes(_address);

    return amounts;
  }

  /**
   * @dev Returns the addresses that each personal stake was created for by an address
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return address[] array of amounts
   */
  function getPersonalStakeForAddresses(address _address) external view returns (address[]) {
    address[] memory stakedFor;
    (,,stakedFor) = getPersonalStakes(_address);

    return stakedFor;
  }

  /**
   * @notice Stakes a certain amount of tokens, this MUST transfer the given amount from the user
   * @notice MUST trigger Staked event
   * @param _amount uint256 the amount of tokens to stake
   * @param _data bytes optional data to include in the Stake event
   */
  function stake(uint256 _amount, bytes _data) public {
    createStake(
      msg.sender,
      _amount,
      _data);
  }

  /**
   * @notice Stakes a certain amount of tokens, this MUST transfer the given amount from the caller
   * @notice MUST trigger Staked event
   * @param _user address the address the tokens are staked for
   * @param _amount uint256 the amount of tokens to stake
   * @param _data bytes optional data to include in the Stake event
   */
  function stakeFor(address _user, uint256 _amount, bytes _data) public {
    createStake(
      _user,
      _amount,
      _data);
  }

  /**
   * @notice Unstakes a certain amount of tokens, this SHOULD return the given amount of tokens to the user, if unstaking is currently not possible the function MUST revert
   * @notice MUST trigger Unstaked event
   * @dev @TODO: Fill in dev details here. Functionality is still in flux.
   * @param _amount uint256 the amount of tokens to unstake
   * @param _data bytes optional data to include in the Unstake event
   */
  function unstake(uint256 _amount, bytes _data) public {
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[stakeHolders[msg.sender].personalStakeIndex];

    // Check that the current stake has unlocked & matches the unstake amount
    // @TODO: This can be improved by looking at all staked tokens as opposed to the current stake,
    //  but that makes things more complicated to keep track of. Suggest we leave it like this for now.
    require(
      personalStake.unlockedTimestamp <= block.timestamp,
      "The current stake hasn't unlocked yet");

    require(
      personalStake.amount == _amount,
      "The current stake doesn't match the unstake amount");

    // Transfer the staked tokens from this contract back to the sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed beforehand.
    require(
      stakingToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    stakeHolders[personalStake.stakedFor].totalStakedFor = stakeHolders[personalStake.stakedFor].totalStakedFor.sub(personalStake.amount);
    personalStake.amount = 0;
    stakeHolders[msg.sender].personalStakeIndex++;

    emit Unstaked(
      msg.sender,
      _amount,
      totalStakedFor(msg.sender),
      _data);
  }

  /**
   * @notice Returns the current total of tokens staked for an address
   * @param _address address The address to query
   * @return uint256 The number of tokens staked for the given address
   */
  function totalStakedFor(address _address) public view returns (uint256) {
    return stakeHolders[_address].totalStakedFor;
  }

  /**
   * @notice Returns the current total of tokens staked
   * @return uint256 The number of tokens staked in the contract
   */
  function totalStaked() public view returns (uint256) {
    return stakingToken.balanceOf(this);
  }

  /**
   * @notice Address of the token being used by the staking interface
   * @return address The address of the ERC20 token used for staking
   */
  function token() public view returns (address) {
    return stakingToken;
  }

  /**
   * @notice MUST return true if the optional history functions are implemented, otherwise false
   * @dev Since we don't implement the optional interface, this always returns false
   * @return bool Whether or not the optional history functions are implemented
   */
  function supportsHistory() public pure returns (bool) {
    return false;
  }

  /**
   * @dev Helper function to create stakes for a given address
   * @param _address address The address the stake is being created for
   * @param _amount uint256 The number of tokens being staked
   * @param _data bytes The optional data emitted in the Staked event
   */
  function createStake(
    address _address,
    uint256 _amount,
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
        block.timestamp.add(lockInDuration),
        _amount,
        _address)
      );

    emit Staked(
      _address,
      _amount,
      totalStakedFor(_address),
      _data);
  }

  /**
   * @dev Helper function to get specific properties of all of the personal stakes created by an address
   * @param _address address The address to query
   * @return (uint256[], uint256[], address[]) timestamps array, amounts array, stakedFor array
   */
  function getPersonalStakes(address _address) view private returns(uint256[], uint256[], address[]) {
    require(stakeHolders[_address].exists, "No stakes at that address");

    StakeContainer storage stakeContainer = stakeHolders[_address];

    uint256 arraySize = stakeContainer.personalStakes.length - stakeContainer.personalStakeIndex;
    uint256[] memory unlockedTimestamps = new uint256[](arraySize);
    uint256[] memory amounts = new uint256[](arraySize);
    address[] memory stakedFor = new address[](arraySize);

    for (uint256 i = stakeContainer.personalStakeIndex; i < stakeContainer.personalStakes.length; i++) {
      uint256 index = i - stakeContainer.personalStakeIndex;
      unlockedTimestamps[index] = stakeContainer.personalStakes[i].unlockedTimestamp;
      amounts[index] = stakeContainer.personalStakes[i].amount;
      stakedFor[index] = stakeContainer.personalStakes[i].stakedFor;
    }

    return (
      unlockedTimestamps,
      amounts,
      stakedFor
    );
  }
}
