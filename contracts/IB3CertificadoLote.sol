// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IB3CertificadoLote {

    function setRouter(address routerAddr_) external;

    function pause() external;

    function unpause() external;

    function safeMint(address to, uint256 tokenId, string memory uri) external;
}
