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

describe('B3Router', () => {
  let b3Router: B3Router;
  let b3Token: B3Token;
  let b3CertificadoLote: B3CertificadoLote;
  let owner: SignerWithAddress;
  let regulator: SignerWithAddress;
  let emissor: SignerWithAddress;
  let masterAcct: SignerWithAddress;
  let acct1: SignerWithAddress;
  let acct2: SignerWithAddress;

  beforeEach(async () => {
    [owner, regulator, emissor, masterAcct, acct1, acct2] = await ethers.getSigners();

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

    b3Router.connect(masterAcct).grantRole(await b3Router.REGULATOR_ROLE(), regulator.address);
    b3Router.connect(masterAcct).grantRole(await b3Router.EMISSOR_ROLE(), emissor.address);
    b3Router
      .connect(masterAcct)
      .grantRole(await b3Router.ALLOWED_CONTRACT_ROLE(), b3CertificadoLote.address);

    b3CertificadoLote
      .connect(masterAcct)
      .grantRole(await b3CertificadoLote.ALLOWED_CONTRACT_ROLE(), b3Router.address);

    b3Token.connect(masterAcct).grantRole(await b3Token.ALLOWED_CONTRACT_ROLE(), b3Router.address);
    b3Token.connect(masterAcct).grantRole(await b3Token.MINTER_TRANSFER_ROLE(), b3Router.address);

    b3Router.connect(masterAcct).addWalletToWhitelist(regulator.address);
    b3Router.connect(masterAcct).addWalletToWhitelist(emissor.address);
    b3Router.connect(masterAcct).addWalletToWhitelist(masterAcct.address);
    b3Router.connect(masterAcct).addWalletToWhitelist(acct1.address);
    b3Router.connect(masterAcct).addWalletToWhitelist(b3Router.address);
  });

  describe('Sanity tests', () => {
    it('should have set b3Token', async () => {
      expect(await b3Router.b3Token()).to.equal(b3Token.address);
    });

    it('should have set b3Certificate', async () => {
      expect(await b3Router.b3Certificados()).to.equal(b3CertificadoLote.address);
    });
  });

  describe('Mint Route tests', () => {
    it('should create new Certificate (NFT)', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      expect(await b3CertificadoLote.totalSupply()).to.equal(1);
      expect(await b3Router.getCertificatesIds()).to.deep.equal([certificateId]);

      const certInfo = await b3Router.getCertificateInfo(certificateId);
      expect(certInfo[0]).to.be.equal(shortDescription);
    });

    it('should fail create new Certificate (NFT) with not authorized acct', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      expect(
        b3Router
          .connect(emissor)
          .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI)
      ).to.be.revertedWith('Caller is not a valid account');
    });

    it('should create new Certificate (NFT) and mint available Tokens', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      await b3Router.connect(emissor).mintAvailableB3Tokens();
      expect(await b3Token.balanceOf(b3Router.address)).to.equal(tokensInitialAmount);
    });

    it('should create new Certificate (NFT) and FAIL on mint available Tokens with not authorized acct', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      expect(b3Router.connect(regulator).mintAvailableB3Tokens()).to.be.revertedWith(
        'Caller is not a valid account'
      );
    });

    it('should create more than 1 Certificate (NFT) and mint available Tokens', async () => {
      // #1
      let certificateId = 1;
      let shortDescription = 'LTof10';
      let tokensInitialAmount = 10;
      let URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      // #2
      certificateId = 2;
      shortDescription = 'LTof1000';
      tokensInitialAmount = 1000;
      URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmU6A1VgY1mRnADWJ6NfkGvqVF1CfSis6PrWns6qfF7eNs';
      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      expect(await b3CertificadoLote.totalSupply()).to.equal(2);

      await b3Router.connect(emissor).mintAvailableB3Tokens();
      expect(await b3Token.balanceOf(b3Router.address)).to.equal(1010); // 10 + 1000
    });

    it('should get some available tokens', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);
      await b3Router.connect(emissor).mintAvailableB3Tokens();
      expect(await b3Token.balanceOf(b3Router.address)).to.equal(tokensInitialAmount);

      // #get some tokens
      await b3Router.connect(acct1).getSomeTokens(1, 5);
      expect(await b3Token.balanceOf(acct1.address)).to.equal(5);
      expect(await b3Token.balanceOf(b3Router.address)).to.equal(5);

      const certInfo = await b3Router.getCertificateInfo(certificateId);
      expect(certInfo[2]).to.equal(5); // actualAmount
    });

    it('should fail to not WL acct getting some available tokens', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);
      await b3Router.connect(emissor).mintAvailableB3Tokens();
      expect(await b3Token.balanceOf(b3Router.address)).to.equal(tokensInitialAmount);

      // # fail to get some tokens
      expect(b3Router.connect(acct2).getSomeTokens(1, 5)).to.be.revertedWith(
        'Wallet nao autorizada'
      );
    });

    it('should fail to get some available tokens with invalid certificateId', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      await b3Router.connect(emissor).mintAvailableB3Tokens();

      expect(await b3Token.balanceOf(b3Router.address)).to.equal(tokensInitialAmount);

      // # fail to get some tokens
      expect(b3Router.connect(acct1).getSomeTokens(2, 5)).to.be.revertedWith(
        'Certificado nao existente'
      );
    });

    it('should fail to get some available tokens with invalid amount', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      await b3Router.connect(emissor).mintAvailableB3Tokens();

      expect(await b3Token.balanceOf(b3Router.address)).to.equal(tokensInitialAmount);

      // # fail to get some tokens
      expect(b3Router.connect(acct1).getSomeTokens(1, 11)).to.be.revertedWith(
        'Quantidade de tokens indisponivel'
      );
    });
    it('should fail to transfer to not WL acct', async () => {
      const certificateId = 1;
      const shortDescription = 'LTof10';
      const tokensInitialAmount = 10;
      const URI =
        'https://maroon-tender-lobster-111.mypinata.cloud/ipfs/QmdnWXCUk6PVgisW8BthA1Bhhrw2cbr4h8g687mXokjv4q';

      await b3Router
        .connect(regulator)
        .createNewCertificate(certificateId, shortDescription, tokensInitialAmount, URI);

      await b3Router.connect(emissor).mintAvailableB3Tokens();

      expect(await b3Token.balanceOf(b3Router.address)).to.equal(tokensInitialAmount);

      // #get some tokens
      await b3Router.connect(acct1).getSomeTokens(1, 5);
      expect(await b3Token.balanceOf(acct1.address)).to.equal(5);

      // # fail to get some tokens
      expect(b3Token.connect(acct1).transfer(acct2.address, 3)).to.be.revertedWith(
        'Caller is not a valid account'
      );
    });
  });
});
