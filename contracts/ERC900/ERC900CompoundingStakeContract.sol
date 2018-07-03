/* solium-disable security/no-block-members */
pragma solidity 0.4.24;

import "./ERC900BasicStakeContract.sol";


/**
 * @title ERC900 Simple Staking Interface basic implementation
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-900.md
 */
contract ERC900CompoundingStakeContract is ERC900BasicStakeContract {
  // For token staked longer than a year, they will become more valuable by this coefficient
  //  e.g., if annualizedInterestRate is 10e17 (0.1 ether), after 1 year the perceived stake is 10% more valuable.
  // Stakeholders will have to ping the contract via updatePerceivedStakeAmounts to have
  //  the contract update the perceived amounts of their stakes.
  uint256 public annualizedInterestRate;

  // The number of seconds in a year (365.25 days)
  // Used for determining when stakes are eligible for interest
  uint256 constant public YEAR_IN_SECONDS = 31557600;

  mapping (address => CompoundingStake[]) public perceivedAmountBalances;

  struct CompoundingStake {
    uint256 lastUpdatedTimestamp;
    uint256 perceivedAmount;
  }

  /**
   * @dev Returns the stake perceivedAmount for active personal stakes for an address
   * @dev These accessors functions are needed until https://github.com/ethereum/web3.js/issues/1241 is solved
   * @param _address address that created the stakes
   * @return uint256[] array of perceivedAmounts
   */
  function getPersonalStakePerceivedAmounts(address _address) external view returns (uint256[]) {
    StakeContract storage stakeContract = stakeHolders[_address];

    uint256 arraySize = stakeContract.personalStakes.length - stakeContract.personalStakeIndex;
    uint256[] memory perceivedAmounts = new uint256[](arraySize);

    for (uint256 i = stakeContract.personalStakeIndex; i < stakeContract.personalStakes.length; i++) {
      uint256 index = i - stakeContract.personalStakeIndex;
      perceivedAmounts[index] = perceivedAmountBalances[_address][i].perceivedAmount;
    }

    return perceivedAmounts;
  }

  function collectInterest(
    address _address
  )
    external
  {
    StakeContract storage stakeContract = stakeHolders[_address];

    for (uint256 i = stakeContract.personalStakeIndex; i < stakeContract.personalStakes.length; i++) {
      Stake storage currentStake = stakeContract.personalStakes[i];
      CompoundingStake storage compoundingStake = perceivedAmountBalances[_address][i];
      uint256 lastUpdatedTimestamp = compoundingStake.lastUpdatedTimestamp;

      // If interest has accrued over multiple years, the actual interest received will be higher than the
      //  annualized interest rate, so we use a loop to accrue this over multiple years
      // @TODO: There are some gas optimizations that can be made here (i.e., calculated the compoundedInterest rate)
      while (block.timestamp.sub(lastUpdatedTimestamp) >= YEAR_IN_SECONDS) {
        uint256 unit = 1 ether;

        uint256 newAmount = compoundingStake.perceivedAmount.mul(annualizedInterestRate.add(unit)).div(unit);
        uint256 difference = newAmount.sub(compoundingStake.perceivedAmount);

        // Update the totalStakedFor with the interest received
        stakeHolders[currentStake.stakedFor].totalStakedFor = stakeHolders[currentStake.stakedFor].totalStakedFor.add(difference);

        // Update the perceivedAmount with the interest received
        compoundingStake.perceivedAmount = newAmount;

        // SafeMath not needed here
        lastUpdatedTimestamp += YEAR_IN_SECONDS;
      }

      // Update the timestamp, so this stake is only eligible for interest a year from now
      if (compoundingStake.lastUpdatedTimestamp != lastUpdatedTimestamp) {
        compoundingStake.lastUpdatedTimestamp = block.timestamp;
      }
    }
  }

  /**
   * @dev Helper function to create stakes for a given address
   * @param _address address The address the stake is being created for
   * @param _amount uint256 The number of tokens being staked
   * @param _lockInDuration uint256 The duration to lock the tokens for
   */
  function createStake(
    address _address,
    uint256 _amount,
    uint256 _lockInDuration,
    bytes _data
  )
    internal
  {
    super.createStake(
      _address,
      _amount,
      _lockInDuration,
      _data);

    perceivedAmountBalances[msg.sender].push(
      CompoundingStake(block.timestamp, _amount)
    );
  }

  function withdrawStake(
    uint256 _amount,
    bytes _data
  )
    internal
  {
    // @NOTE: We just update values involving the perceivedAmount here.
    // Other values will be taken care of in the call to the base class.
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[stakeHolders[msg.sender].personalStakeIndex];
    CompoundingStake storage compoundingStake = perceivedAmountBalances[msg.sender][stakeHolders[msg.sender].personalStakeIndex];

    uint256 difference = compoundingStake.perceivedAmount.sub(personalStake.actualAmount);

    stakeHolders[personalStake.stakedFor].totalStakedFor = stakeHolders[personalStake.stakedFor]
      .totalStakedFor.sub(difference);

    compoundingStake.perceivedAmount = 0;

    super.withdrawStake(_amount, _data);
  }
}
