// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./B3CertificadoLote.sol";
import "./B3Token.sol";

contract B3Router is AccessControl, Pausable {
    address public b3Certificados;
    address public b3Token;
    
    struct Certificado {
        string shortDescription;
        uint256 tokensInitialAmount;
        uint256 tokensActualAmount;
        bool isExhausted;
        bool minted;
        bool exists;
    }

    mapping (uint256 => Certificado) certificados;
    uint256[] private certificadoIDs;

    mapping(address => bool) allowedWallets;
    address[] public wallets;

    constructor(address _b3Certificados, address _b3Token) {
        b3Certificados = _b3Certificados;
        b3Token = _b3Token;
    }

    function createNewCertificate(uint256 certificateId, string calldata shortDescription, uint256 tokensInitialAmount, string calldata URI) external {
        require(!certificados[certificateId].exists, "Certificado ja emitido");
        certificados[certificateId] = Certificado (
            shortDescription,
            tokensInitialAmount,
            tokensInitialAmount,
            false,
            false,
            true
        );
        B3CertificadoLote(b3Certificados).safeMint(msg.sender, certificateId, URI);
    }

    function getCertificatesIds() view external returns (uint256[] memory){

        return certificadoIDs;
    }

    function getCertificateInfo(uint256 certificateId) view external returns (Certificado memory) {
        require(certificados[certificateId].exists, "Certificado nao existente");
        return certificados[certificateId];
    }

    function addWalletToWhitelist(address walletAddress) external {
        allowedWallets[walletAddress] = true;
    }

    function removeWalletFromWhitelist(address walletAddress) external {
        allowedWallets[walletAddress] = false;
    }

    function getWhitelistedWallets() view external returns (address[] memory) {
        uint256 walletsCount = wallets.length;
        address[] memory retWallets = new address[](walletsCount);
        for(uint256 i; i<walletsCount; ++i) {
            if(allowedWallets[wallets[i]]) {
                retWallets[i] = wallets[i];
            }
        }
        return retWallets;
    }

    function mintAvailableB3Tokens() external {
        // Adicionar calculo de gas disponivel
        uint256 qtdeCertificados = certificadoIDs.length;

        for(uint256 i; i<qtdeCertificados; ++i) {
            if(!certificados[certificadoIDs[i]].minted) {
                B3Token(b3Token).mint(msg.sender, certificados[certificadoIDs[i]].tokensInitialAmount);
            }
        }
    }

    function burnCertificatesAmount(uint256 amount) external {
        uint256 qtdeCertificados = certificadoIDs.length;
        uint256 amountToBurn = amount;

        for(uint256 i; i<qtdeCertificados; ++i) {
            (uint256 val, uint256 index) = getCertificateMinorTokensAmount(); 
            if(val >= amountToBurn) {
                certificados[certificadoIDs[index]].tokensActualAmount -= amountToBurn;
                certificados[certificadoIDs[index]].isExhausted = true;
            } else {
                certificados[certificadoIDs[index]].tokensActualAmount -= val;
                certificados[certificadoIDs[index]].isExhausted = true;
                amountToBurn -= val;
            }
        }
        require(amountToBurn == 0, "Nao foi possivel queimar a quantidade desejada");
    }

    function getCertificateMinorTokensAmount() view public returns (uint256 value, uint256 index) {
        uint256 qtdeCertificados = certificadoIDs.length;
        uint256 minorAmount = 0;

        for(uint256 i; i<qtdeCertificados; ++i) {
            if(!certificados[certificadoIDs[i]].isExhausted) {
                if(certificados[certificadoIDs[i]].tokensActualAmount < minorAmount) {
                    minorAmount = certificados[certificadoIDs[i]].tokensActualAmount;
                    value = minorAmount;
                    index = i;
                }
            }
        }

        return (value, index);
    }
}