pragma solidity 0.4.24;

import "./CodexRecordMetadata.sol";
import "./CodexRecordFees.sol";


/**
 * @title CodexRecordCore
 * @dev Core functionality of the token, namely minting.
 */
contract CodexRecordCore is CodexRecordFees {

  /**
   * @dev This event is emitted when a new token is minted and allows providers
   *  to discern which Minted events came from transactions they submitted vs
   *  transactions submitted by other platforms, as well as providing information
   *  about what metadata record the newly minted token should be associated with.
   */
  event Minted(uint256 _tokenId, bytes _data);

  /**
   * @dev Sets the global tokenURIPrefix for use when returning token metadata.
   *  Only callable by the owner.
   * @param _tokenURIPrefix string The new tokenURIPrefix
   */
  function setTokenURIPrefix(string _tokenURIPrefix) external onlyOwner {
    tokenURIPrefix = _tokenURIPrefix;
  }

  /**
   * @dev Creates a new token
   * @param _to address The address the token will get transferred to after minting
   * @param _nameHash bytes32 The sha3 hash of the name
   * @param _descriptionHash bytes32 The sha3 hash of the description
   * @param _data (optional) bytes Additional data that will be emitted with the Minted event
   */
  function mint(
    address _to,
    bytes32 _nameHash,
    bytes32 _descriptionHash,
    bytes32[] _fileHashes,
    bytes _data
  )
    public
  {
    // All new tokens will be the last entry in the array
    uint256 newTokenId = allTokens.length;
    internalMint(_to, newTokenId);

    // Add metadata to the newly created token
    tokenData[newTokenId] = CodexRecordData({
      nameHash: _nameHash,
      descriptionHash: _descriptionHash,
      fileHashes: _fileHashes
    });

    emit Minted(newTokenId, _data);
  }

  function internalMint(address _to, uint256 _tokenId) internal {
    require(_to != address(0));

    tokenOwner[_tokenId] = _to;
    ownedTokensCount[_to] = ownedTokensCount[_to].add(1);

    ownedTokensIndex[_tokenId] = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);

    allTokens.push(_tokenId);

    emit Transfer(address(0), _to, _tokenId);
  }
}
