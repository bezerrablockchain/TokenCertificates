// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IB3Token {

    function pause() external;

    function unpause() external;

    function mint(address to, uint256 amount) external;
    
    function transfer(address to, uint256 amount) external;

    function setRouter(address routerAddr_) external;
}
