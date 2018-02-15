pragma solidity ^0.4.18;

//import "./ERC721.sol";
//import "./ERC721Metadata.sol";

import "zeppelin-solidity/contracts/math/SafeMath.sol";

/*

TODO:
- Have an interface definition for BDX
- Have a pointer to the address where BDX is deployed
- Update payable operations to take a fee in BDX

- Allow minting capabilities
- Allow updating capabilities
- Getter functions

- Optimize for gas cost later. Focus on functionality for now!

*/

contract CodexTitle {

    using SafeMath for uint256;

    struct Deed {
        string name;
        string description;
    }

    Deed[] deeds;

    mapping (uint256 => address) deedIdToOwner;
    mapping (uint256 => address) deedIdToApproved;
    mapping (address => uint256) ownerToDeedCount;

    /// @notice A descriptive name for a collection of deeds managed by this
    ///  contract
    /// @dev Wallets and exchanges MAY display this to the end user.
    function name() public pure returns (string _name) {
        return "Codex Title";
    }

    /// @notice A distinct name for a deed managed by this contract
    /// @dev Wallets and exchanges MAY display this to the end user.
    //function deedName(uint256 _deedId) public pure returns (string _deedName) {
    //    return "Codex Title";
    //}

    /// @notice A distinct URI (RFC 3986) for a given token.
    /// @dev If:
    ///  * The URI is a URL
    ///  * The URL is accessible
    ///  * The URL points to a valid JSON file format (ECMA-404 2nd ed.)
    ///  * The JSON base element is an object
    ///  then these names of the base element SHALL have special meaning:
    ///  * "name": A string identifying the item to which `_deedId` grants
    ///    ownership
    ///  * "description": A string detailing the item to which `_deedId` grants
    ///    ownership
    ///  * "image": A URI pointing to a file of image/* mime type representing
    ///    the item to which `_deedId` grants ownership
    ///  Wallets and exchanges MAY display this to the end user.
    ///  Consider making any images at a width between 320 and 1080 pixels and
    ///  aspect ratio between 1.91:1 and 4:5 inclusive.
    //function deedUri(uint256 _deedId) external view returns (string _deedUri);

    /// @notice Find the owner of a deed
    /// @param _deedId The identifier for a deed we are inspecting
    /// @dev Deeds assigned to zero address are considered invalid, and
    ///  queries about them do throw.
    /// @return The non-zero address of the owner of deed `_deedId`, or `throw`
    ///  if deed `_deedId` is not tracked by this contract
    function ownerOf(uint256 _deedId) external view returns (address _owner) {
        return deedIdToOwner[_deedId];
    }

    /// @notice Count deeds tracked by this contract
    /// @return A count of valid deeds tracked by this contract, where each one of
    ///  them has an assigned and queryable owner not equal to the zero address
    function countOfDeeds() external view returns (uint256 _count) {
        return deeds.length;
    }

    /// @notice Count all deeds assigned to an owner
    /// @dev Throws if `_owner` is the zero address, representing invalid deeds.
    /// @param _owner An address where we are interested in deeds owned by them
    /// @return The number of deeds owned by `_owner`, possibly zero
    function countOfDeedsByOwner(address _owner) external view returns (uint256 _count) {
        require(_owner != 0);

        return ownerToDeedCount[_owner];
    }

    /// @notice Enumerate deeds assigned to an owner
    /// @dev Throws if `_index` >= `countOfDeedsByOwner(_owner)` or if
    ///  `_owner` is the zero address, representing invalid deeds.
    /// @param _owner An address where we are interested in deeds owned by them
    /// @param _index A counter less than `countOfDeedsByOwner(_owner)`
    /// @return The identifier for the `_index`th deed assigned to `_owner`,
    ///   (sort order not specified)
    function deedOfOwnerByIndex(address _owner, uint256 _index) external view returns (uint256 _deedId) {
        require(_owner != 0);

        require(_index < ownerToDeedCount[_owner]);

        uint256 counter = 0;
        for (uint256 i = 0; i < deeds.length; i++) {
            if (deedIdToOwner[i] == _owner) {
                if (counter == _index) {
                    return i;
                }

                counter++;
            }
        }
    }

    // TRANSFER MECHANISM //////////////////////////////////////////////////////

    /// @dev This event emits when ownership of any deed changes by any
    ///  mechanism. This event emits when deeds are created (`from` == 0) and
    ///  destroyed (`to` == 0). Exception: during contract creation, any
    ///  transfers may occur without emitting `Transfer`. At the time of any transfer,
    ///  the "approved taker" is implicitly reset to the zero address.
    event Transfer(address indexed from, address indexed to, uint256 indexed deedId);

    /// @dev The Approve event emits to log the "approved taker" for a deed -- whether
    ///  set for the first time, reaffirmed by setting the same value, or setting to  
    ///  a new value. The "approved taker" is the zero address if nobody can take the
    ///  deed now or it is an address if that address can call `takeOwnership` to attempt
    ///  taking the deed. Any change to the "approved taker" for a deed SHALL cause
    ///  Approve to emit. However, an exception, the Approve event will not emit when
    ///  Transfer emits, this is because Transfer implicitly denotes the "approved taker"
    ///  is reset to the zero address.
    event Approval(address indexed owner, address indexed approved, uint256 indexed deedId);

    /// @notice Set the "approved taker" for your deed, or revoke approval by
    ///  setting the zero address. You may `approve` any number of times while
    ///  the deed is assigned to you, only the most recent approval matters. Emits
    ///  an Approval event.
    /// @dev Throws if `msg.sender` does not own deed `_deedId` or if `_to` ==
    ///  `msg.sender` or if `_deedId` is not a valid deed.
    /// @param _deedId The deed for which you are granting approval
    function approve(address _to, uint256 _deedId) external payable {
        require(msg.sender != _to);

        require(msg.sender == deedIdToOwner[_deedId]);

        deedIdToApproved[_deedId] = _to;

        Approval(msg.sender, _to, _deedId);
    }

    /// @notice Become owner of a deed for which you are currently approved
    /// @dev Throws if `msg.sender` is not approved to become the owner of
    ///  `deedId` or if `msg.sender` currently owns `_deedId` or if `_deedId is not a
    ///  valid deed.
    /// @param _deedId The deed that is being transferred
    function takeOwnership(uint256 _deedId) external payable {
        address owner = deedIdToOwner[_deedId];

        require(msg.sender != owner);

        require(msg.sender == deedIdToApproved[_deedId]);

        ownerToDeedCount[owner]--;
        deedIdToOwner[_deedId] = msg.sender;

        Transfer(owner, msg.sender, _deedId);
    }

    // CREATION AND UPDATING MECHANISMS //////////////////////////////////////////////////////

    event Minted(address indexed owner, uint256 indexed deedId);

    function _mint(string _name, string _description) internal {
        // TODO: any require protections needed?

        uint256 id = deeds.push(Deed(_name, _description)) - 1;
        deedIdToOwner[id] = msg.sender;
        ownerToDeedCount[msg.sender]++;

        Minted(msg.sender, id);
    }

    function createNewDeed(string _name, string _description) external payable {
        _mint(_name, _description);
    }

    // UTILITY //////////////////////////////////////////////////////

    function getDeedData(uint256 _deedId) external view returns(string, string) {
        Deed storage deed = deeds[_deedId];
        return (deed.name, deed.description);
    }
}