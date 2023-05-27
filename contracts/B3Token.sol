// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './IB3Router.sol';

contract B3Token is ERC20, Pausable, Ownable {
    address routerAddr;

    constructor() ERC20('B3Token', 'B3T') {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) whenNotPaused {
        //Add whitelist logic here
        if (to == address(0)) { //Burn
            // Add here the logic to burn the certificate with amount that can 
            IB3Router(routerAddr).burnCertificatesAmount(amount);
        } else {

        }
        super._beforeTokenTransfer(from, to, amount);
    }

    function setRouter(address routerAddr_) external onlyOwner {
        require(routerAddr_ != address(0), 'Invalid router address');
        routerAddr = routerAddr_;
    }
}
