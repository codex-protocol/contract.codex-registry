# Codex Protocol | Codex Registry Contracts
[![Build Status](https://travis-ci.org/codex-protocol/contract.codex-registry.svg?branch=master)](https://travis-ci.org/codex-protocol/contract.codex-registry)

## To do
- Extensive testing on ERC900
- Token Ejection (similar to BiddableEscrow)
- 100% code coverage
- Gas optimization
- TCR for providers
- Add a version field to the tokens themselves so we can track if they've been upgraded or not. This is useful for cases where storage state in the new implementation needs to be migrated over.

## Notes
- If you accidentally send ERC-20 tokens to the address where this is deployed, please email contact@codexprotocol.com to discuss retrieval

## Thanks to
- OpenZeppelin for providing tons of contract functionality in their repo at https://github.com/OpenZeppelin/zeppelin-solidity. Licensing for files taken from that repo can be found at OZ_LICENSE.
