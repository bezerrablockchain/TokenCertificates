// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

contract B3CertificadoLote is
    Context,
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    Pausable,
    AccessControl
{
    bytes32 public constant ALLOWED_CONTRACT_ROLE = keccak256('ALLOWED_CONTRACT_ROLE');

    address routerAddr;
    address public masterAcct;

    string private _contractURI;

    modifier onlyRoleOrMasterAcct(bytes32 role) {
        require(
            hasRole(role, _msgSender()) || masterAcct == _msgSender(),
            'Caller is not a valid account'
        );
        _;
    }

    constructor(address _masterAcct) ERC721('CertificadoLote', 'CTFL') {
        masterAcct = _masterAcct;
        _setupRole(DEFAULT_ADMIN_ROLE, masterAcct);
    }

    function setRouter(address routerAddr_) external onlyRoleOrMasterAcct(DEFAULT_ADMIN_ROLE) {
        require(routerAddr_ != address(0), 'Invalid router address');
        routerAddr = routerAddr_;
    }

    function pause() public onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE) {
        _pause();
    }

    function unpause() public onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE) {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId, string memory uri) public onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE) {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function burn(uint256 tokenId) public virtual {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            'ERC721: caller is not token owner or approved'
        );
        _burn(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function setContractURI(string memory newcontractURI)
        public
        onlyRoleOrMasterAcct(DEFAULT_ADMIN_ROLE)
    {
        _contractURI = newcontractURI;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
