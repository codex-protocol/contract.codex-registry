pragma solidity ^0.4.23;

import "./ERC20/ERC20.sol";
import "./library/Pausable.sol";


/**
 * @title CodexTitleFees
 * @dev Storage, mutators, and modifiers for fees when using the token.
 *  This also includes the Pausable contract for the onlyOwner modifier.
 */
contract CodexTitleFees is Pausable {

  // Address of the ERC20 Codex Protocol Token, used for fees in the contract
  address public codexTokenAddress;

  // Implementation of ERC20 Codex Protocol Token, used for fees in the contract
  ERC20 public codexToken;

  // Address where all contract fees are sent, i.e., the Community Fund
  address public feeRecipient;

  // Fee to create new tokens. 10^18 = 1 token
  uint256 public creationFee = 0;

  /**
   * @dev Sets the address of the ERC20 token used for fees in the contract.
   * @param _codexTokenAddress The address of the ERC20 Codex Protocol Token
   * @param _feeRecipient The address where the fees are sent
   * @param _creationFee The new creation fee. 10^18 is 1 token.
   */
  function setFees(address _codexTokenAddress, address _feeRecipient, uint256 _creationFee) external onlyOwner {
    codexTokenAddress = _codexTokenAddress;
    codexToken = ERC20(codexTokenAddress);
    feeRecipient = _feeRecipient;
    creationFee = _creationFee;
  }

  /**
   * @dev Sets the creation fee in CODX
   * @param _creationFee The new creation fee. 10^18 is 1 token.
   */
  function setCreationFee(uint256 _creationFee) external onlyOwner {
    creationFee = _creationFee;
  }
}
