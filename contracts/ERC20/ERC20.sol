pragma solidity 0.4.24;

import "./ERC20Basic.sol";


/**
 * @title ERC20 interface
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
 */
contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public view returns (uint256);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function approve(address spender, uint256 value) public returns (bool);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}
