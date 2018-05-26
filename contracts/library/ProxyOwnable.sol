pragma solidity ^0.4.24;


/**
 * @title ProxyOwnable
 * @dev Essentially the Ownable contract, renamed for the purposes of separating it from the
 *  DelayedOwnable contract (the owner of the token contract).
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract ProxyOwnable {
  address public proxyOwner;

  event ProxyOwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev The Ownable constructor sets the original `proxyOwner` of the contract to the sender
   * account.
   */
  constructor() public {
    proxyOwner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == proxyOwner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferProxyOwnership(address _newOwner) public onlyOwner {
    require(_newOwner != address(0));

    emit ProxyOwnershipTransferred(proxyOwner, _newOwner);

    proxyOwner = _newOwner;
  }
}
