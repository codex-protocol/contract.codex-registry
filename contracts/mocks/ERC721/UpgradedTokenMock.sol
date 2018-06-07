pragma solidity 0.4.24;

import "./ERC721TokenMock.sol";
import "../../library/DelayedOwnable.sol";


/**
 * @title UpgradedTokenMock
 * This mock just provides introduces new state and modifies the minting function for
 *  testing purposes.
 *
 * NOTE: The new state should be independent of the old state to avoid having to go
 *  through an expensive (and complicated/dangerous) migration process. For example,
 *  it's not straight forward to deploy ERC721BasicToken and then later upgrade to
 *  ERC721Token because of how much the mint/transfer logic changes. A better example
 *  would be to migrate to change the fee structure of the minting/transfer functions
 *  as seen in this mock.
 */
contract UpgradedTokenMock is ERC721TokenMock, DelayedOwnable {
  uint256 public mintingFeesAccumulated = 0;
  uint256 public constant MINTING_FEE = 100000;

  constructor(string _name, string _symbol) public
    ERC721TokenMock(_name, _symbol)
  { }

  function withdrawMintingFees() external onlyOwner {
    msg.sender.transfer(mintingFeesAccumulated);
  }

  function mint(address _to, uint256 _tokenId) payable public onlyOwner {
    require(msg.value == MINTING_FEE);

    mintingFeesAccumulated += msg.value;

    super.mint(_to, _tokenId);
  }
}
