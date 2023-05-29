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

describe('B3CertificadoLote', () => {
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
    b3Router = await b3RouterFactory.deploy(b3CertificadoLote.address, b3Token.address, masterAcct.address);
    await b3Router.deployed();

    expect(b3Token.address).to.properAddress;
    expect(b3CertificadoLote.address).to.properAddress;
    expect(b3Router.address).to.properAddress;

    b3Token.connect(masterAcct).setRouter(b3Router.address);
    b3CertificadoLote.connect(masterAcct).setRouter(b3Router.address);
    b3CertificadoLote.connect(masterAcct).setContractURI("https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmQ3FnJN7aE5QLEJsr5frFRLew9UiX19h7MBxQdvxPHeRb");
  });

  describe('Sanity tests', () => {
    it('should have a name', async () => {
      expect(await b3CertificadoLote.name()).to.equal('CertificadoLote');
    });

    it('should have a symbol', async () => {
      expect(await b3CertificadoLote.symbol()).to.equal('CTFL');
    });
  });

  describe('Basic tests', () => {
    it('should mint a certificate', async () => {
      await b3CertificadoLote.connect(masterAcct).safeMint(emissor.address, 0, 'ipfs://pinata/test');
      expect(await b3CertificadoLote.balanceOf(emissor.address)).to.equal(1);
    });

    it('should fail on try burn a certificate not being owner', async () => {
      await b3CertificadoLote.connect(masterAcct).safeMint(emissor.address, 0, 'ipfs://pinata/test');
      expect(await b3CertificadoLote.balanceOf(emissor.address)).to.equal(1);
      expect(b3CertificadoLote.burn(0)).to.be.revertedWith(
        'ERC721: caller is not token owner or approved'
      );
      expect(await b3CertificadoLote.balanceOf(emissor.address)).to.equal(1);
    });

    it('should burn a certificate', async () => {
      await b3CertificadoLote.connect(masterAcct).safeMint(emissor.address, 0, 'ipfs://pinata/test');
      expect(await b3CertificadoLote.balanceOf(emissor.address)).to.equal(1);
      await b3CertificadoLote.connect(emissor).burn(0);
      expect(await b3CertificadoLote.balanceOf(emissor.address)).to.equal(0);
    });
    
  });
});
