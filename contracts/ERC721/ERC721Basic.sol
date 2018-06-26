pragma solidity 0.4.24;


/**
 * @title ERC721 Non-Fungible Token Standard basic interface
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Basic {
  // bytes4(keccak256('balanceOf(address)')) ^
  // bytes4(keccak256('ownerOf(uint256)')) ^
  // bytes4(keccak256('approve(address,uint256)')) ^
  // bytes4(keccak256('getApproved(uint256)')) ^
  // bytes4(keccak256('setApprovalForAll(address,bool)')) ^
  // bytes4(keccak256('isApprovedForAll(address,address)')) ^
  // bytes4(keccak256('transferFrom(address,address,uint256)')) ^
  // bytes4(keccak256('safeTransferFrom(address,address,uint256)')) ^
  // bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)'));
  bytes4 constant INTERFACE_ERC721 = 0x80ac58cd;

  event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
  event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
  event ApprovalForAll(address indexed _owner, address indexed _operator, bool indexed _approved);

  function balanceOf(address _owner) public view returns (uint256 _balance);
  function ownerOf(uint256 _tokenId) public view returns (address _owner);

  // Note: This is not in the official ERC-721 standard so it's not included in the interface hash
  function exists(uint256 _tokenId) public view returns (bool _exists);

  function approve(address _to, uint256 _tokenId) public;
  function getApproved(uint256 _tokenId) public view returns (address _operator);

  function setApprovalForAll(address _operator, bool _approved) public;
  function isApprovedForAll(address _owner, address _operator) public view returns (bool);

  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId) public;

  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId) public;

  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId,
    bytes _data) public;
}
