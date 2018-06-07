pragma solidity 0.4.24;

import "./ERC721Basic.sol";


/**
 * @title ERC-721 Non-Fungible Token Standard, optional enumeration extension
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Enumerable is ERC721Basic {
  // bytes4(keccak256('totalSupply()')) ^
  // bytes4(keccak256('tokenOfOwnerByIndex(address,uint256)')) ^
  // bytes4(keccak256('tokenByIndex(uint256)'));
  bytes4 constant INTERFACE_ERC721_ENUMERABLE = 0x780e9d63;

  function totalSupply() public view returns (uint256);
  function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256 _tokenId);
  function tokenByIndex(uint256 _index) public view returns (uint256);
}


/**
 * @title ERC-721 Non-Fungible Token Standard, optional metadata extension
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Metadata is ERC721Basic {
  // bytes4(keccak256('name()')) ^
  // bytes4(keccak256('symbol()')) ^
  // bytes4(keccak256('tokenURI(uint256)'));
  bytes4 constant INTERFACE_ERC721_METADATA = 0x5b5e139f;

  function name() public view returns (string _name);
  function symbol() public view returns (string _symbol);
  function tokenURI(uint256 _tokenId) public view returns (string);
}


/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
/* solium-disable-next-line no-empty-blocks */
contract ERC721 is ERC721Basic, ERC721Enumerable, ERC721Metadata {
}
