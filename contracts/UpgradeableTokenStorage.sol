pragma solidity ^0.4.21;

import "./UpgradeabilityStorage.sol";
import "./ERC721/ERC721BasicTokenStorage.sol";


contract UpgradeableTokenStorage is UpgradeabilityStorage, ERC721BasicTokenStorage {

}