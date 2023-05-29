// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IB3Router {
    function isWalletWhitelisted(address walletAddress) external view returns (bool);
    function burnCertificatesAmount(address certOwner, uint256 amount) external;
}
