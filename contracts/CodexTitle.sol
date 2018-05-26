pragma solidity ^0.4.24;

import "./CodexTitleAccess.sol";


/**
 * @title CodexTitle, an ERC721 token for arts & collectables
 * @dev Developers should never interact with this smart contract directly!
 *  All transactions/calls should be made through CodexTitleProxy. Storage will be maintained
 *  in that smart contract so that the Codex Protocol governing body has the ability
 *  to upgrade the contract in the future in the event of an emergency or new functionality.
 */
contract CodexTitle is CodexTitleAccess {
  constructor() public ERC721Token("Codex Title", "CT") { }
}
