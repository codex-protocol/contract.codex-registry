pragma solidity ^0.4.24;

import "./ERC20/ERC20.sol";
import "./ERC900/ERC900.sol";

import "./library/Pausable.sol";


/**
 * @title CodexTitleFees
 * @dev Storage, mutators, and modifiers for fees when using the token.
 *  This also includes the Pausable contract for the onlyOwner modifier.
 */
contract CodexTitleFees is Pausable {

  // Implementation of the ERC20 Codex Protocol Token, used for fees in the contract
  ERC20 public codexToken;

  // Implementation of the ERC900 Codex Protocol Stake Container,
  //  used to calculate discounts on fees
  ERC900 public codexStakeContainer;

  // Address where all contract fees are sent, i.e., the Community Fund
  address public feeRecipient;

  // Fee to create new tokens. 10^18 = 1 token
  uint256 public creationFee = 0;

  modifier canPayFees() {
    if (feeRecipient != address(0)) {
      // TODO: Update the discount to be based on weight as opposed to just
      //  a binary on/off value
      uint256 calculatedFee = creationFee;
      if (codexStakeContainer != address(0) &&
        codexStakeContainer.totalStakedFor(msg.sender) >= 0) {

        calculatedFee = 0;
      }

      require(
        codexToken.transferFrom(msg.sender, feeRecipient, calculatedFee),
        "Fee in CODX required");
    }

    _;
  }

  /**
   * @dev Sets the address of the ERC20 token used for fees in the contract.
   * @param _codexToken The address of the ERC20 Codex Protocol Token
   * @param _feeRecipient The address where the fees are sent
   * @param _creationFee The new creation fee. 10^18 is 1 token.
   */
  function setFees(ERC20 _codexToken, address _feeRecipient, uint256 _creationFee) external onlyOwner {
    codexToken = _codexToken;
    feeRecipient = _feeRecipient;
    creationFee = _creationFee;
  }

  function setStakeContainer(ERC900 _codexStakeContainer) external onlyOwner {
    codexStakeContainer = _codexStakeContainer;
  }

  /**
   * @dev Sets the creation fee in CODX
   * @param _creationFee The new creation fee. 10^18 is 1 token.
   */
  function setCreationFee(uint256 _creationFee) external onlyOwner {
    creationFee = _creationFee;
  }
}
