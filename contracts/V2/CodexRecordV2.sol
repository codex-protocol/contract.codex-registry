pragma solidity 0.4.24;

import "./CodexRecordAccessV2.sol";


/**
 * @title CodexRecordV2, an ERC721 token for arts & collectables
 * @dev Developers should never interact with this smart contract directly!
 *  All transactions/calls should be made through CodexRecordProxy. Storage will be maintained
 *  in that smart contract so that the governing body has the ability
 *  to upgrade the contract in the future in the event of an emergency or new functionality.
 *
 *
 * TODO: put V2 notes here
 *
 */
contract CodexRecordV2 is CodexRecordAccessV2 {
  /**
   * @dev Constructor function
   */
  constructor() public ERC721Token("Codex Record", "CR") { }

  /**
   * @dev Reclaim all ERC20Basic compatible tokens
   * @param token ERC20Basic The address of the token contract
   */
  function reclaimToken(ERC20Basic token) external onlyOwner {
    uint256 balance = token.balanceOf(this);
    token.transfer(owner, balance);
  }
}
