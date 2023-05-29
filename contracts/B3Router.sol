// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import './IB3CertificadoLote.sol';
import './IB3Token.sol';

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
        bool isExhausted;
        bool minted;
        bool exists;
    }

    mapping(uint256 => Certificate) certificates;
    uint256[] private certificatesIDs;

    mapping(address => bool) public allowedWallets;
    address[] public wallets;

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
        
        certificates[certificateId] = Certificate(
            shortDescription,
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
    }

    function burnCertificatesAmount(uint256 amount) external onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE){
        uint256 qtdeCertificados = certificatesIDs.length;
        uint256 amountToBurn = amount;

        for (uint256 i; i < qtdeCertificados; ++i) {
            (uint256 val, uint256 index) = getCertificateMinorTokensAmount();
            if (val >= amountToBurn) {
                certificates[certificatesIDs[index]].tokensActualAmount -= amountToBurn;
                certificates[certificatesIDs[index]].isExhausted = true;
            } else {
                certificates[certificatesIDs[index]].tokensActualAmount -= val;
                certificates[certificatesIDs[index]].isExhausted = true;
                amountToBurn -= val;
            }
        }
        require(amountToBurn == 0, 'Nao foi possivel queimar a quantidade desejada');
    }

    function getCertificateMinorTokensAmount() public view returns (uint256 value, uint256 index) {
        uint256 qtdeCertificados = certificatesIDs.length;
        uint256 minorAmount = 0;

        for (uint256 i; i < qtdeCertificados; ++i) {
            if (!certificates[certificatesIDs[i]].isExhausted) {
                if (certificates[certificatesIDs[i]].tokensActualAmount < minorAmount) {
                    minorAmount = certificates[certificatesIDs[i]].tokensActualAmount;
                    value = minorAmount;
                    index = i;
                }
            }
        }

        return (value, index);
    }
}
