pragma solidity ^0.4.18;

import "./zeppelin-solidity/token/ERC721/ERC721Token.sol";


contract CodexTitle is ERC721Token {
  function CodexTitle() public ERC721Token("Codex Title", "CT") {

  }
}
