pragma solidity 0.4.24;

import "./CodexRecordAccess.sol";


/**
 * @title CodexRecord, an ERC721 token for arts & collectables
 * @dev Developers should never interact with this smart contract directly!
 *  All transactions/calls should be made through CodexRecordProxy. Storage will be maintained
 *  in that smart contract so that the governing body has the ability
 *  to upgrade the contract in the future in the event of an emergency or new functionality.
 */
contract CodexRecord is CodexRecordAccess {
  /**
   * @dev Constructor function
   */
  constructor() public ERC721Token("Codex Record", "CR") { }
}
