pragma solidity ^0.4.18;

/// @title Enumeration extension to ERC-721 interface
/// @author William Entriken (https://phor.net)
/// @dev Specification at https://github.com/ethereum/eips/issues/XXXX
interface ERC721Enumerable {

    /// @dev ERC-165 (draft) interface signature for ERC721
    // bytes4 internal constant INTERFACE_SIGNATURE_ERC721Enumerable = // 0xa5e86824
    //     bytes4(keccak256('deedByIndex()')) ^
    //     bytes4(keccak256('countOfOwners()')) ^
    //     bytes4(keccak256('ownerByIndex(uint256)'));

    /// @notice Enumerate active deeds
    /// @dev Throws if `_index` >= `countOfDeeds()`
    /// @param _index A counter less than `countOfDeeds()`
    /// @return The identifier for the `_index`th deed, (sort order not
    ///  specified)
    function deedByIndex(uint256 _index) external view returns (uint256 _deedId);

    /// @notice Count of owners which own at least one deed
    /// @return A count of the number of owners which own deeds
    function countOfOwners() external view returns (uint256 _count);

    /// @notice Enumerate owners
    /// @dev Throws if `_index` >= `countOfOwners()`
    /// @param _index A counter less than `countOfOwners()`
    /// @return The address of the `_index`th owner (sort order not specified)
    function ownerByIndex(uint256 _index) external view returns (address _owner);
}