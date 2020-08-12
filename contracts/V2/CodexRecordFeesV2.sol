pragma solidity 0.4.24;

import "./CodexRecordMetadataV2.sol";
import "../CodexStakeContractInterface.sol";
import "../ERC20/ERC20.sol";

import "../library/SafeMath.sol";
import "../library/DelayedPausable.sol";


/**
 * @title CodexRecordFeesV2
 * @dev Storage, mutators, and modifiers for fees when using the token.
 *  This also includes the DelayedPausable contract for the onlyOwner modifier.
 */
contract CodexRecordFeesV2 is CodexRecordMetadataV2, DelayedPausable {

  using SafeMath for uint256;

  // Implementation of the ERC20 Codex Protocol Token, used for fees in the contract
  ERC20 public codexCoin;

  // Implementation of the ERC900 Codex Protocol Stake Container,
  //  used to calculate discounts on fees
  CodexStakeContractInterface public codexStakeContract;

  // Address where all contract fees are sent, i.e., the Community Fund
  address public feeRecipient;

  // Fee to create new tokens. 10^18 = 1 token
  uint256 public creationFee = 0;

  // Fee to transfer tokens. 10^18 = 1 token
  uint256 public transferFee = 0;

  // Fee to modify tokens. 10^18 = 1 token
  uint256 public modificationFee = 0;

  // NEW IN V2: 50% discount === .5 * 1 token (i.e. 500000000000000000)
  mapping (address => uint256) internal _discountPercentages;

  // NEW IN V2:
  mapping (address => bool) public feeOperators;

  // NEW IN V2:
  event FeeOperatorAdded(address indexed _feeOperator);
  event FeeOperatorRemoved(address indexed _feeOperator);
  event DiscountPercentUpdated(
    address indexed _address,
    uint256 indexed _discountPercent,
    address indexed _feeOperator,
    bytes _data
  );

  // NEW IN V2:
  modifier onlyFeeOperators() {
    require(
      isFeeOperator(msg.sender),
      "msg.sender must be in feeOperators");
    _;
  }

  modifier canPayFees(uint256 _baseFee) {

    if (feeRecipient != address(0) && _baseFee > 0) {

      // @NOTE: we do _discountPercentages[msg.sender].mul(_baseFee) instead of
      //  _baseFee.mul(_discountPercentages[msg.sender]) because SafeMath.mul()
      //  has a gas optimization if the first argument is 0 (which is usually
      //  the case)
      uint256 discount = _discountPercentages[msg.sender].mul(_baseFee).div(1000000000000000000); // 10 ** codexCoin.decimals()
      uint256 discountedFee = _baseFee.sub(discount);

      if (discountedFee > 0) {

        bool feePaid = false;

        if (codexStakeContract != address(0)) {
          uint256 discountCredits = codexStakeContract.creditBalanceOf(msg.sender);

          // Regardless of what the baseFee is, all transactions can be paid by using exactly one credit
          if (discountCredits > 0) {
            codexStakeContract.spendCredits(msg.sender, 1);
            feePaid = true;
          }
        }

        if (!feePaid) {
          require(
            codexCoin.transferFrom(msg.sender, feeRecipient, discountedFee),
            "Insufficient funds"
          );
        }

      }

    }

    _;
  }

  // NEW IN V2:
  function addFeeOperator(address _newFeeOperator) external onlyOwner {
    require(_newFeeOperator != address(0), "_newFeeOperator must not be the zero address");
    require(feeOperators[_newFeeOperator] != true, "_newFeeOperator is already in feeOperators");
    feeOperators[_newFeeOperator] = true;
    emit FeeOperatorAdded(_newFeeOperator);
  }

  // NEW IN V2:
  function removeFeeOperator(address _feeOperator) external onlyOwner {
    require(_feeOperator != address(0), "_feeOperator must not be the zero address");
    require(feeOperators[_feeOperator] == true, "_feeOperator is not in feeOperators");
    feeOperators[_feeOperator] = false;
    emit FeeOperatorRemoved(_feeOperator);
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

  function setStakeContract(CodexStakeContractInterface _codexStakeContract) external onlyOwner {
    codexStakeContract = _codexStakeContract;
  }

  function setDiscountPercent(address _address, uint256 _discountPercent, bytes _data) external onlyFeeOperators {
    require(_address != address(0), "Address must not be zero address.");
    require(_discountPercent <= 1000000000000000000, "Discount percent must not be greater than 1 token.");
    _discountPercentages[_address] = _discountPercent;
    emit DiscountPercentUpdated(
      _address,
      _discountPercent,
      msg.sender,
      _data
    );
  }

  function getDiscountPercent(address _address) public view returns (uint256) {
    return _discountPercentages[_address];
  }

  // NEW IN V2:
  function isFeeOperator(address _who) public view returns (bool) {
    return feeOperators[_who] == true;
  }

}
