// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import './IB3CertificadoLote.sol';
import './IB3Token.sol';

import 'hardhat/console.sol';

contract B3Router is Context, AccessControl, Pausable {
    bytes32 public constant REGULATOR_ROLE = keccak256('REGULATOR_ROLE');
    bytes32 public constant EMISSOR_ROLE = keccak256('EMISSOR_ROLE');
    bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');
    bytes32 public constant ALLOWED_CONTRACT_ROLE = keccak256('ALLOWED_CONTRACT_ROLE');

    address public b3Certificados;
    address public b3Token;
    address public masterAcct;

    modifier onlyRoleOrMasterAcct(bytes32 role) {
        require(
            hasRole(role, _msgSender()) || masterAcct == _msgSender(),
            'Caller is not a valid account'
        );
        _;
    }

    struct Certificate {
        string shortDescription;
        uint256 tokensInitialAmount;
        uint256 tokensActualAmount;
        uint256 notBurnedAmount;
        bool isExhausted;
        bool minted;
        bool exists;
    }

    mapping(address => uint256[]) public ownedCertificates; // # Address => Certificates IDs

    mapping(uint256 => Certificate) certificates;
    uint256[] private certificatesIDs;

    mapping(address => bool) public allowedWallets;
    address[] public wallets = new address[](0);

    constructor(address _b3Certificados, address _b3Token, address _masterAcct) {
        b3Certificados = _b3Certificados;
        b3Token = _b3Token;
        masterAcct = _masterAcct;
        _setupRole(DEFAULT_ADMIN_ROLE, masterAcct);
    }

    function pause() public onlyRoleOrMasterAcct(PAUSER_ROLE) {
        _pause();
        IB3Token(b3Token).pause();
        IB3CertificadoLote(b3Certificados).pause();
    }

    function unpause() public onlyRoleOrMasterAcct(PAUSER_ROLE) {
        _unpause();
        IB3Token(b3Token).unpause();
        IB3CertificadoLote(b3Certificados).unpause();
    }

    function createNewCertificate(
        uint256 certificateId,
        string calldata shortDescription,
        uint256 tokensInitialAmount,
        string calldata URI
    ) external onlyRoleOrMasterAcct(REGULATOR_ROLE){
        require(!certificates[certificateId].exists, 'Certificado ja emitido');
        require(certificateId > 0, 'ID do certificado invalido - deve ser maior que zero');
        
        certificates[certificateId] = Certificate(
            shortDescription,
            tokensInitialAmount,
            tokensInitialAmount,
            tokensInitialAmount,
            false,
            false,
            true
        );

        certificatesIDs.push(certificateId);
        IB3CertificadoLote(b3Certificados).safeMint(_msgSender(), certificateId, URI);
    }

    function getCertificatesIds() external view returns (uint256[] memory) {
        return certificatesIDs;
    }

    function getCertificateInfo(uint256 certificateId) external view returns (Certificate memory) {
        require(certificates[certificateId].exists, 'Certificado nao existente');
        return certificates[certificateId];
    }

    function getAvailableCertificates() external view returns (Certificate[] memory) {
        uint256 qtdeCertificados = certificatesIDs.length;
        Certificate[] memory retCertificados = new Certificate[](qtdeCertificados);
        for (uint256 i; i < qtdeCertificados; ++i) {
            if (!certificates[certificatesIDs[i]].isExhausted) {
                retCertificados[i] = certificates[certificatesIDs[i]];
            }
        }
        return retCertificados;
    }

    function addWalletToWhitelist(address walletAddress) external onlyRoleOrMasterAcct(DEFAULT_ADMIN_ROLE){
        allowedWallets[walletAddress] = true;
    }

    function removeWalletFromWhitelist(address walletAddress) external onlyRoleOrMasterAcct(DEFAULT_ADMIN_ROLE){
        allowedWallets[walletAddress] = false;
    }

    function getWhitelistedWallets() external view returns (address[] memory) {
        uint256 walletsCount = wallets.length;
        address[] memory retWallets = new address[](walletsCount);
        for (uint256 i; i < walletsCount; ++i) {
            if (allowedWallets[wallets[i]]) {
                retWallets[i] = wallets[i];
            }
        }
        return retWallets;
    }

    function isWalletWhitelisted(address walletAddress) external view returns (bool) {
        return allowedWallets[walletAddress];
    }

    function mintAvailableB3Tokens() external onlyRoleOrMasterAcct(EMISSOR_ROLE){
        // Adicionar calculo de gas disponivel
        uint256 qtdeCertificados = certificatesIDs.length;

        for (uint256 i; i < qtdeCertificados; ++i) {
            if (!certificates[certificatesIDs[i]].minted) {
                IB3Token(b3Token).mint(
                    address(this),
                    certificates[certificatesIDs[i]].tokensInitialAmount
                );
            }
        }
    }

    function getSomeTokens(uint256 certificateID, uint256 amount) external {
        require(allowedWallets[_msgSender()], 'Wallet nao autorizada');
        require(certificates[certificateID].exists, 'Certificado nao existente');
        require(!certificates[certificateID].isExhausted, 'Certificado esgotado');
        require(
            certificates[certificateID].tokensActualAmount >= amount,
            'Quantidade de tokens indisponivel'
        );

        certificates[certificateID].tokensActualAmount -= amount;
        IB3Token(b3Token).transfer(_msgSender(), amount);

        uint256 totalOwnedCertificates = ownedCertificates[_msgSender()].length;
        bool found = false;
        for (uint256 i; i < totalOwnedCertificates; ++i) {
            if (ownedCertificates[_msgSender()][i] == certificateID) {
                found = true;
                // console.log("Certificado ja existente- %d", certificateID);
                break;
            }
        } 
        if (!found) {
            ownedCertificates[_msgSender()].push(certificateID);
            // console.log("Certificado adicionado - %d", certificateID);
        }
    }

    function burnCertificatesAmount(address certOwner, uint256 amount) external onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE){
        uint256 qtdeCertificados = certificatesIDs.length;
        uint256 amountToBurn = amount;

        for (uint256 i; i < qtdeCertificados; ++i) {
            (uint256 val, uint256 index) = getCertificateMinorTokensAmount(certOwner);
            // console.log("Valor %d - Index %d", val, index);

            if (val >= amountToBurn) {
                certificates[certificatesIDs[index]].notBurnedAmount -= amountToBurn;
                certificates[certificatesIDs[index]].isExhausted = true;
                amountToBurn = 0;
            } else {
                certificates[certificatesIDs[index]].notBurnedAmount -= val;
                certificates[certificatesIDs[index]].isExhausted = true;
                amountToBurn -= val;
            }
        }
        require(amountToBurn == 0, 'Nao foi possivel queimar a quantidade desejada');
    }

    function getCertificateMinorTokensAmount(address certOwner) public view returns (uint256 value, uint256 index) {
        uint256 qtdeCertificados = ownedCertificates[certOwner].length;
        // console.log("Qtde %d", qtdeCertificados);

        // #extract not exhausted array
        uint256[] memory notExhaustedCertificatesIDs = new uint256[](qtdeCertificados);
        uint256 notExhaustedCertificatesCount = 0;
        for (uint256 i; i < qtdeCertificados; ++i) {
            if (!certificates[ownedCertificates[certOwner][i]].isExhausted) {
                notExhaustedCertificatesIDs[i] = ownedCertificates[certOwner][i];
                ++notExhaustedCertificatesCount;
            }
        }

        require(notExhaustedCertificatesCount > 0, 'Nao ha certificados disponiveis');

        uint256 minorAmount = certificates[notExhaustedCertificatesIDs[0]].notBurnedAmount;
        value = minorAmount;
        index = 0;

        for (uint256 i; i < qtdeCertificados; ++i) {
            if (notExhaustedCertificatesIDs[i] != 0) { // #avoid exhausteds
                if (certificates[certificatesIDs[i]].notBurnedAmount < minorAmount) {
                    minorAmount = certificates[certificatesIDs[i]].notBurnedAmount;
                    value = minorAmount;
                    index = i;
                }
            }
        }

        return (value, index);
    }

    function getOwnedCertificates() external view returns (uint256[] memory) {
        return ownedCertificates[_msgSender()];
    }
}
