pragma solidity 0.4.24;


import "../library/DelayedPausable.sol";


// mock class using DelayedPausable
contract DelayedPausableMock is DelayedPausable {
  bool public drasticMeasureTaken;
  uint256 public count;

  constructor() public {
    drasticMeasureTaken = false;
    count = 0;
  }

  function normalProcess() external whenNotPaused {
    count++;
  }

  function drasticMeasure() external whenPaused {
    drasticMeasureTaken = true;
  }

}
