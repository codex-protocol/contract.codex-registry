pragma solidity 0.4.24;

import "./PausableToken.sol";


/**
 * @title CodexCoin, an ERC-20 token
 */
contract CodexCoin is PausableToken {

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
