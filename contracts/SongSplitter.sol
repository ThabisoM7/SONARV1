// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SongSplitter {
    event PaymentReleased(address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    uint256 public totalShares;
    uint256 public totalReleased;

    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;
    address[] public payees;

    constructor(address[] memory _payees, uint256[] memory _shares) payable {
        require(_payees.length == _shares.length, "Splitter: length mismatch");
        require(_payees.length > 0, "Splitter: no payees");

        for (uint256 i = 0; i < _payees.length; i++) {
            _addPayee(_payees[i], _shares[i]);
        }
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function _addPayee(address account, uint256 shares_) private {
        require(account != address(0), "Splitter: account is zero address");
        require(shares_ > 0, "Splitter: shares are 0");
        require(shares[account] == 0, "Splitter: account has shares");

        payees.push(account);
        shares[account] = shares_;
        totalShares = totalShares + shares_;
    }

    function release(address payable account) public virtual {
        require(shares[account] > 0, "Splitter: account has no shares");

        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = (totalReceived * shares[account]) / totalShares - released[account];

        require(payment != 0, "Splitter: account is not due payment");

        released[account] = released[account] + payment;
        totalReleased = totalReleased + payment;

        Address.sendValue(account, payment);
        emit PaymentReleased(account, payment);
    }

    // Helper to release for all (gas heavy but useful for UX)
    function distribute() public {
        for (uint256 i = 0; i < payees.length; i++) {
            release(payable(payees[i]));
        }
    }
}

library Address {
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }
}
