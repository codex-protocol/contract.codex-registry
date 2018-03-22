pragma solidity ^0.4.19;

import "./zeppelin-solidity/Ownable.sol";
import "./ERC721.sol";


contract CodexTitleCore is ERC721, Ownable {
    modifier tokenIndexInSupply(uint256 _tokenId) {
        require(_tokenId >= 0 && _tokenId < codexTitles.length);
        _;
    }

    /// @dev This emits when ownership of any NFT changes by any mechanism.
    ///  This event emits when NFTs are created (`from` == 0) and destroyed
    ///  (`to` == 0). Exception: during contract creation, any number of NFTs
    ///  may be created and assigned without emitting Transfer. At the time of
    ///  any transfer, the approved address for that NFT (if any) is reset to none.
    event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT. When transfer is complete, this function
    ///  checks if `_to` is a smart contract (code size > 0). If so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    /// @param data Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) external payable {
        _safeTransferFrom(_from, _to, _tokenId, data);
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev This works identically to the other function with an extra data parameter,
    ///  except this function just sets data to ""
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable {
        _safeTransferFrom(_from, _to, _tokenId, "");
    }

    /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
    ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
    ///  THEY MAY BE PERMANENTLY LOST
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function transferFrom(address _from, address _to, uint256 _tokenId) external tokenIndexInSupply(_tokenId) payable {
        _transferFrom(_from, _to, _tokenId);
    }

    /// @notice Set or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    /// @dev Throws unless `msg.sender` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external tokenIndexInSupply(_tokenId) payable {
        address owner = tokenIdToOwnerAddressMap[_tokenId];
        require(msg.sender == owner || ownerAddressToOperatorsMap[owner][msg.sender]);

        tokenIdToApprovedAddressMap[_tokenId] = _approved;

        Approval(owner, _approved, _tokenId);
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all your assets.
    /// @dev Emits the ApprovalForAll event
    /// @param _operator Address to add to the set of authorized operators.
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) external {
        ownerAddressToOperatorsMap[msg.sender][_operator] = _approved;

        ApprovalForAll(msg.sender, _operator, _approved);
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT
    /// @param _tokenId The NFT to find the approved address for
    /// @return The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _tokenId) external view tokenIndexInSupply(_tokenId) returns (address _approved) {
        return tokenIdToApprovedAddressMap[_tokenId];
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return ownerAddressToOperatorsMap[_owner][_operator];
    }

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256 _balance) {
        require(_owner != address(0));

        // TODO: This is obviously wrong
        //  The correct implementation isn't clear here. Not feasible to do a
        //  for loop over an array of possibly 4 billion in length. Correct
        //  solution might be to track the titles each owner owns in a separate data structure
        //  However, that makes operations like transfer more expensive because they require
        //  array manipulation on each call.
        return codexTitles.length;
    }

    /// @notice Find the owner of an NFT
    /// @param _tokenId The identifier for an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @return The address of the owner of the NFT
    function ownerOf(uint256 _tokenId) external view tokenIndexInSupply(_tokenId) returns (address _owner) {
        return tokenIdToOwnerAddressMap[_tokenId];
    }

    // TODO: Implement the SAFE version of transfer
    function _safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes _data) internal {
        _data = "";
        _transferFrom(_from, _to, _tokenId);
    }

    function _transferFrom(address _from, address _to, uint256 _tokenId) internal {
        address owner = tokenIdToOwnerAddressMap[_tokenId];
        require(_from == owner
            || _from == tokenIdToApprovedAddressMap[_tokenId]
            || ownerAddressToOperatorsMap[owner][_from]);

        require(_to != address(0));

        tokenIdToOwnerAddressMap[_tokenId] = _to;
        tokenIdToApprovedAddressMap[_tokenId] = address(0);

        Transfer(_from, _to, _tokenId);
    }

    struct CodexTitle {
        string name;
        string description;
        string imageUri;
    }

    CodexTitle[] public codexTitles;

    mapping (uint256 => address) public tokenIdToOwnerAddressMap;

    mapping (uint256 => address) public tokenIdToApprovedAddressMap;

    mapping (address => mapping (address => bool)) public ownerAddressToOperatorsMap;
}