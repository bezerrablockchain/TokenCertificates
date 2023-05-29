// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Context.sol';
import './IB3Router.sol';

contract B3Token is Context, ERC20, Pausable, AccessControl {
    bytes32 public constant ALLOWED_CONTRACT_ROLE = keccak256('ALLOWED_CONTRACT_ROLE');
    bytes32 public constant MINTER_TRANSFER_ROLE = keccak256('MINTER_TRANSFER_ROLE');

    address routerAddr;
    address public masterAcct;

    modifier onlyRoleOrMasterAcct(bytes32 role) {
        require(
            hasRole(role, _msgSender()) || masterAcct == _msgSender(),
            'Caller is not a valid account'
        );
        _;
    }

    constructor(address _masterAcct) ERC20('B3Token', 'B3T') {
        masterAcct = _masterAcct;
        _setupRole(DEFAULT_ADMIN_ROLE, masterAcct);
        _setupRole(MINTER_TRANSFER_ROLE, masterAcct);
    }

    function pause() public onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE) {
        _pause();
    }

    function unpause() public onlyRoleOrMasterAcct(ALLOWED_CONTRACT_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRoleOrMasterAcct(MINTER_TRANSFER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override(ERC20) onlyRoleOrMasterAcct(MINTER_TRANSFER_ROLE) returns (bool) {
        address owner = _msgSender();
        super._transfer(owner, to, amount);
        return true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) whenNotPaused {
        if (to == address(0)) { // # Burn
            require(IB3Router(routerAddr).isWalletWhitelisted(from), 'Wallet nao autorizada');
            IB3Router(routerAddr).burnCertificatesAmount(amount);
        } else { // # Mint or Transfer
            require(IB3Router(routerAddr).isWalletWhitelisted(to), 'Wallet nao autorizada');
        }
        super._beforeTokenTransfer(from, to, amount);
    }

    function setRouter(address routerAddr_) external onlyRoleOrMasterAcct(DEFAULT_ADMIN_ROLE) {
        require(routerAddr_ != address(0), 'Invalid router address');
        _revokeRole(ALLOWED_CONTRACT_ROLE, routerAddr);
        _revokeRole(MINTER_TRANSFER_ROLE, routerAddr);
        routerAddr = routerAddr_;
        _setupRole(ALLOWED_CONTRACT_ROLE, routerAddr);
        _setupRole(MINTER_TRANSFER_ROLE, routerAddr);
    }
}
