pragma solidity ^0.4.24;

import "./StandardToken.sol";


contract CodexToken is StandardToken {

  /* solium-disable uppercase */
  uint8 constant public decimals = 18;

  string constant public name = "Codex Protocol Token";

  string constant public symbol = "CODX";
  /* solium-enable */

  constructor() public {
    totalSupply_ = 10 ** 27;
    balances[msg.sender] = totalSupply_;
  }
}
