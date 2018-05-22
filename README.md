# Codex Protocol | Codex Registry Contracts

## To do
### Testing
- Extensive testing on CodexTitle

### Features
- Documentation hashes array for CodexTitle (i.e., in addition to images)
- Add a version field to the tokens themselves so we can track if they've been upgraded or not. This is useful for cases where storage state in the new implementation needs to be migrated over.
- Consider adding the burn functionality back in, but maybe restricting it to onlyOwner for now.

## Notes
- Everything under the zeppelin-solidity directory was copied over from node_modules/zeppelin-solidity to give visibility into the contract code and so they can be pinned to a specific compiler version. No extensive changes have been made
- This contract is not intended to be used directly on it's own. Users should instead communicate to the contract through instances of the Biddable Widget hosted by our consortium members
- If you accidentally send ERC-20 tokens to the address where this is deployed, please email contact@codexprotocol.com to discuss retrieval

## Thanks to
- OpenZeppelin for providing tons of contract functionality in their repo at https://github.com/OpenZeppelin/zeppelin-solidity. Licensing for files taken from that repo can be found at OZ_LICENSE.
