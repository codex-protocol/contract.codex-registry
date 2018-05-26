pragma solidity ^0.4.24;


import "../library/SafeMath.sol";


contract SafeMathMock {
  uint256 public result;

  function multiply(uint256 a, uint256 b) public {
    result = SafeMath.mul(a, b);
  }

  function subtract(uint256 a, uint256 b) public {
    result = SafeMath.sub(a, b);
  }

  function add(uint256 a, uint256 b) public {
    result = SafeMath.add(a, b);
  }
}
