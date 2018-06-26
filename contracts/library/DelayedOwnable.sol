pragma solidity 0.4.24;


/**
 * @title DelayedOwnable
 * @dev The DelayedOwnable contract has an owner address, and provides basic authorization control
 *  functions, this simplifies the implementation of "user permissions".
 * @dev This is different than the original Ownable contract because intializeOwnable
 *  must be specifically called after creation to create an owner.
 */
contract DelayedOwnable {
  address public owner;
  bool public isInitialized = false;

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function initializeOwnable(address _owner) external {
    require(
      !isInitialized,
      "The owner has already been set");

    isInitialized = true;
    owner = _owner;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) public onlyOwner {
    require(_newOwner != address(0));

    emit OwnershipTransferred(owner, _newOwner);

    owner = _newOwner;
  }
}
