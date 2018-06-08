/* solium-disable security/no-block-members */
pragma solidity 0.4.24;

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

  // For token staked longer than a year, they will become more valuable by this coefficient
  //  e.g., if interestRate is 10, after 1 year the perceived stake is 10% more valuable.
  // Stakeholders will have to ping the contract via updatePerceivedStakeAmounts to have
  //  the contract update the perceived amounts of their stakes.
  uint256 public annualizedInterestRate;

  // The number of seconds in a year (365.25 days)
  // Used for determining when stakes are eligible for interest
  uint256 constant public YEAR_IN_SECONDS = 31557600;

  // To save on gas, rather than create a separate mapping for totalStakedFor & personalStakes,
  //  both data structures are stored in a single mapping for a given addresses.
  //
  // It's possible to have a non-existing personalStakes, but have tokens in totalStakedFor
  //  if other users are staking on behalf of a given address.
  mapping (address => StakeContainer) public stakeHolders;

  // Struct for personal stakes (i.e., stakes made by this address)
  // lastUpdatedTimestamp - when the perceivedAmount of the stake was last updated
  // unlockedTimestamp - when the stake unlocks (in seconds since Unix epoch)
  // actualAmount - the amount of tokens in the stake
  // perceivedAmount - the weighted amount of tokens in the stake
  // stakedFor - the address the stake was staked for
  struct Stake {
    uint256 lastUpdatedTimestamp;
    uint256 unlockedTimestamp;
    uint256 actualAmount;
    uint256 perceivedAmount;
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
    (timestamps,,,) = getPersonalStakes(_address);

    return timestamps;
  }

  /**
   * @dev Returns the stake actualAmount for active personal stakes for an address
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return uint256[] array of actualAmounts
   */
  function getPersonalStakeActualAmounts(address _address) external view returns (uint256[]) {
    uint256[] memory actualAmounts;
    (,actualAmounts,,) = getPersonalStakes(_address);

    return actualAmounts;
  }

  /**
   * @dev Returns the stake perceivedAmount for active personal stakes for an address
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return uint256[] array of perceivedAmounts
   */
  function getPersonalStakePerceivedAmounts(address _address) external view returns (uint256[]) {
    uint256[] memory perceivedAmounts;
    (,,perceivedAmounts,) = getPersonalStakes(_address);

    return perceivedAmounts;
  }

  /**
   * @dev Returns the addresses that each personal stake was created for by an address
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return address[] array of amounts
   */
  function getPersonalStakeForAddresses(address _address) external view returns (address[]) {
    address[] memory stakedFor;
    (,,,stakedFor) = getPersonalStakes(_address);

    return stakedFor;
  }

  /**
   * @dev Updates the perceivedAmount for all personal stakes at the given address
   * @param _address The address to update personal stakes
   */
  function updatePerceivedStakeAmounts(address _address) external {
    StakeContainer storage stakeContainer = stakeHolders[_address];

    for (uint256 i = stakeContainer.personalStakeIndex; i < stakeContainer.personalStakes.length; i++) {
      Stake storage currentStake = stakeContainer.personalStakes[i];
      uint256 lastUpdatedTimestamp = currentStake.lastUpdatedTimestamp;

      // If interest has accrued over multiple years, the actual interest received will be higher than the
      //  annualized interest rate, so we use a loop to accrue this over multiple years
      // @TODO: There are some gas optimizations that can be made here (i.e., calculated the compoundedInterest rate)
      while (block.timestamp.sub(lastUpdatedTimestamp) >= YEAR_IN_SECONDS) {
        uint256 unit = 1 ether;

        uint256 newAmount = currentStake.perceivedAmount.mul(annualizedInterestRate.add(unit)).div(unit);
        uint256 difference = newAmount.sub(currentStake.perceivedAmount);

        // Update the totalStakedFor with the interest received
        stakeHolders[currentStake.stakedFor].totalStakedFor = stakeHolders[currentStake.stakedFor].totalStakedFor.add(difference);

        // Update the perceivedAmount with the interest received
        currentStake.perceivedAmount = newAmount;

        // SafeMath not needed here
        lastUpdatedTimestamp += YEAR_IN_SECONDS;
      }

      // Update the timestamp, so this stake is only eligible for interest a year from now
      if (currentStake.lastUpdatedTimestamp != lastUpdatedTimestamp) {
        currentStake.lastUpdatedTimestamp = block.timestamp;
      }
    }
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
   * @dev Unstaking tokens is an atomic operation—either all of the tokens in a stake, or none of the tokens.
   * @dev Users can only unstake a single stake at a time, it is must be their oldest active stake. Upon releasing that stake, the tokens will be
   *  transferred back to their account, and their personalStakeIndex will increment to the next active stake.
   * @param _amount uint256 the amount of tokens to unstake
   * @param _data bytes optional data to include in the Unstake event
   */
  function unstake(uint256 _amount, bytes _data) public {
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[stakeHolders[msg.sender].personalStakeIndex];

    // Check that the current stake has unlocked & matches the unstake amount
    require(
      personalStake.unlockedTimestamp <= block.timestamp,
      "The current stake hasn't unlocked yet");

    require(
      personalStake.actualAmount == _amount,
      "The unstake amount does not match the current stake");

    // Transfer the staked tokens from this contract back to the sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed beforehand.
    require(
      stakingToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    // Notice that we are reducing totalStakedFor by the perceivedAmount of tokens in case any interest had accrued
    //  in the stakes for that address
    stakeHolders[personalStake.stakedFor].totalStakedFor = stakeHolders[personalStake.stakedFor]
      .totalStakedFor.sub(personalStake.perceivedAmount);

    personalStake.actualAmount = 0;
    personalStake.perceivedAmount = 0;
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
   * @dev Helper function to get specific properties of all of the personal stakes created by an address
   * @param _address address The address to query
   * @return (uint256[], uint256[], uint256[], address[])
   *  timestamps array, actualAmounts array, perceivedAmounts array, stakedFor array
   */
  function getPersonalStakes(
    address _address
  )
    view
    public
    returns(uint256[], uint256[], uint256[], address[])
  {
    StakeContainer storage stakeContainer = stakeHolders[_address];

    uint256 arraySize = stakeContainer.personalStakes.length - stakeContainer.personalStakeIndex;
    uint256[] memory unlockedTimestamps = new uint256[](arraySize);
    uint256[] memory actualAmounts = new uint256[](arraySize);
    uint256[] memory perceivedAmounts = new uint256[](arraySize);
    address[] memory stakedFor = new address[](arraySize);

    for (uint256 i = stakeContainer.personalStakeIndex; i < stakeContainer.personalStakes.length; i++) {
      uint256 index = i - stakeContainer.personalStakeIndex;
      unlockedTimestamps[index] = stakeContainer.personalStakes[i].unlockedTimestamp;
      actualAmounts[index] = stakeContainer.personalStakes[i].actualAmount;
      perceivedAmounts[index] = stakeContainer.personalStakes[i].perceivedAmount;
      stakedFor[index] = stakeContainer.personalStakes[i].stakedFor;
    }

    return (
      unlockedTimestamps,
      actualAmounts,
      perceivedAmounts,
      stakedFor
    );
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
    bytes _data
  )
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
        block.timestamp.add(lockInDuration),
        _amount,
        _amount,
        _address)
      );

    emit Staked(
      _address,
      _amount,
      totalStakedFor(_address),
      _data);
  }
}
