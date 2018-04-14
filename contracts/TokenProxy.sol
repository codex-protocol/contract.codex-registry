pragma solidity ^0.4.21;

import "./UpgradeabilityProxy.sol";
import "./ERC721/ERC721BasicTokenStorage.sol";


contract TokenProxy is UpgradeabilityProxy, ERC721BasicTokenStorage {

}