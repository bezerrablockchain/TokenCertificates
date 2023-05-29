import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

import type { B3Router } from '../typechain-types/contracts/B3Router';
import type { B3Token } from '../typechain-types/contracts/B3Token';
import type { B3CertificadoLote } from '../typechain-types/contracts/B3CertificadoLote';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);
chai.use(chaiAsPromised);
const { expect } = chai;

describe('B3Token', () => {
  let b3Router: B3Router;
  let b3Token: B3Token;
  let b3CertificadoLote: B3CertificadoLote;
  let owner: SignerWithAddress;
  let regulator: SignerWithAddress;
  let emissor: SignerWithAddress;
  let masterAcct: SignerWithAddress;

  beforeEach(async () => {
    [owner, regulator, emissor, masterAcct] = await ethers.getSigners();

    // #Token Deploy
    const b3TokenFactory = await ethers.getContractFactory('B3Token', owner);
    b3Token = await b3TokenFactory.deploy(masterAcct.address);
    await b3Token.deployed();

    // #Certificado Lote Deploy
    const b3CertificadoLoteFactory = await ethers.getContractFactory('B3CertificadoLote', owner);
    b3CertificadoLote = await b3CertificadoLoteFactory.deploy(masterAcct.address);
    await b3CertificadoLote.deployed();

    // #Router Deploy
    const b3RouterFactory = await ethers.getContractFactory('B3Router', owner);
    b3Router = await b3RouterFactory.deploy(
      b3CertificadoLote.address,
      b3Token.address,
      masterAcct.address
    );
    await b3Router.deployed();

    expect(b3Token.address).to.properAddress;
    expect(b3CertificadoLote.address).to.properAddress;
    expect(b3Router.address).to.properAddress;

    b3Token.connect(masterAcct).setRouter(b3Router.address);
    b3CertificadoLote.connect(masterAcct).setRouter(b3Router.address);
    b3CertificadoLote
      .connect(masterAcct)
      .setContractURI(
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmQ3FnJN7aE5QLEJsr5frFRLew9UiX19h7MBxQdvxPHeRb'
      );

      b3Router.connect(masterAcct).addWalletToWhitelist(regulator.address);
      b3Router.connect(masterAcct).addWalletToWhitelist(emissor.address);
      b3Router.connect(masterAcct).addWalletToWhitelist(masterAcct.address);
      b3Router.connect(masterAcct).addWalletToWhitelist(owner.address);
  });

  describe('Sanity tests', () => {
    it('should have a name', async () => {
      expect(await b3Token.name()).to.equal('B3Token');
    });

    it('should have a symbol', async () => {
      expect(await b3Token.symbol()).to.equal('B3T');
    });

    it('should have 18 decimals', async () => {
      expect(await b3Token.decimals()).to.equal(18);
    });
  });

  describe('Basic tests', () => {
    it('should fail for a unauthorized account mint', async () => {
      await expect(b3Token.connect(emissor).mint(owner.address, 100)).to.be.revertedWith(
        'Caller is not a valid account'
      );
    });

    it('should mint', async () => {
      await b3Token.connect(masterAcct).mint(owner.address, 100);
      expect(await b3Token.balanceOf(owner.address)).to.equal(100);
    });

    it('should fail burn for not minted amount by certificate', async () => {
      await b3Token.connect(masterAcct).mint(emissor.address, 100);
      expect(await b3Token.balanceOf(emissor.address)).to.equal(100);
      expect(b3Token.connect(emissor).burn(50)).to.be.revertedWith('Caller is not a valid account');
    });
  });
});
