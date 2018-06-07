pragma solidity 0.4.24;

import "./CodexRecordMetadata.sol";
import "./ERC20/ERC20.sol";
import "./ERC900/ERC900.sol";

import "./library/Pausable.sol";


/**
 * @title CodexRecordFees
 * @dev Storage, mutators, and modifiers for fees when using the token.
 *  This also includes the Pausable contract for the onlyOwner modifier.
 */
contract CodexRecordFees is CodexRecordMetadata, Pausable {

  // Implementation of the ERC20 Codex Protocol Token, used for fees in the contract
  ERC20 public codexCoin;

  // Implementation of the ERC900 Codex Protocol Stake Container,
  //  used to calculate discounts on fees
  ERC900 public codexStakeContainer;

  // Address where all contract fees are sent, i.e., the Community Fund
  address public feeRecipient;

  // Fee to create new tokens. 10^18 = 1 token
  uint256 public creationFee = 0;

  // Fee to transfer tokens. 10^18 = 1 token
  uint256 public transferFee = 0;

  // Fee to modify tokens. 10^18 = 1 token
  uint256 public modificationFee = 0;

  // To receive a full discount on the protocol fees, stake this number of tokens
  uint256 public tokensNeededForFullDiscount;

  modifier canPayFees(uint256 baseFee) {
    if (feeRecipient != address(0)) {
      uint256 calculatedFee = baseFee;

      if (codexStakeContainer != address(0) && tokensNeededForFullDiscount > 0) {
        uint256 totalStakedFor = codexStakeContainer.totalStakedFor(msg.sender);

        // Discounts are capped at 100% :)
        if (totalStakedFor > tokensNeededForFullDiscount) {
          calculatedFee = 0;
        } else if (totalStakedFor > 0) {
          // Since floating point operations aren't supported in the EVM, we need to use a divisor to simulate fractions
          uint256 divisor = 1 ether;

          // The calculated discount is a % of tokens staked against the tokens needed to be staked
          // e.g., if tokensNeededForFullDiscount is 100, and totalStakedFor is 50, the calculated discount is 50%
          uint256 calculatedDiscount = totalStakedFor.mul(divisor).div(tokensNeededForFullDiscount);

          // Update the fee based on the calculated discount, using the divisor again to convert back to the appropriate units
          calculatedFee = baseFee.mul(divisor.sub(calculatedDiscount)).div(divisor);
        }
      }

      if (calculatedFee > 0) {
        require(
          codexCoin.transferFrom(msg.sender, feeRecipient, calculatedFee),
          "Fee in CODX required");
      }
    }

    _;
  }

  /**
   * @dev Sets the address of the ERC20 token used for fees in the contract.
   *  Fees are in the smallest denomination, e.g., 10^18 is 1 token.
   * @param _codexCoin ERC20 The address of the ERC20 Codex Protocol Token
   * @param _feeRecipient address The address where the fees are sent
   * @param _creationFee uint256 The new creation fee.
   * @param _transferFee uint256 The new transfer fee.
   * @param _modificationFee uint256 The new modification fee.
   */
  function setFees(
    ERC20 _codexCoin,
    address _feeRecipient,
    uint256 _creationFee,
    uint256 _transferFee,
    uint256 _modificationFee
  )
    external
    onlyOwner
  {
    codexCoin = _codexCoin;
    feeRecipient = _feeRecipient;
    creationFee = _creationFee;
    transferFee = _transferFee;
    modificationFee = _modificationFee;
  }

  function setStakeContainer(ERC900 _codexStakeContainer) external onlyOwner {
    codexStakeContainer = _codexStakeContainer;
  }

  /**
   * @dev Sets the number of tokens needed to be staked in order to
   * receive a 100% discount on the contract fees. 10^18 is 1 token.
   * @param _tokensNeededForFullDiscount uint256 The number of tokens needed
   */
  function setTokensNeededForFullDiscount(
    uint256 _tokensNeededForFullDiscount
  )
    external
    onlyOwner
  {
    tokensNeededForFullDiscount = _tokensNeededForFullDiscount;
  }
}
