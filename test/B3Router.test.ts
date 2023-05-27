import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { solidity } from 'ethereum-waffle'
import { ethers } from 'hardhat'

import type { B3Router } from '../typechain-types/contracts/B3Router';
import type { B3Token } from '../typechain-types/contracts/B3Token';
import type { B3CertificadoLote } from '../typechain-types/contracts/B3CertificadoLote';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity)
chai.use(chaiAsPromised)
const { expect } = chai

describe('B3Router', () => {

    let b3Router: B3Router;
    let b3Token: B3Token;
    let b3CertificadoLote: B3CertificadoLote;
    let owner: SignerWithAddress;
    let regulator: SignerWithAddress;
    let emissor: SignerWithAddress;

    beforeEach(async () => {
        [owner, regulator, emissor] = await ethers.getSigners();

        // #Token Deploy
        const b3TokenFactory = await ethers.getContractFactory('B3Token', owner);
        b3Token = await b3TokenFactory.deploy();
        await b3Token.deployed();

        // #Certificado Lote Deploy
        const b3CertificadoLoteFactory = await ethers.getContractFactory('B3CertificadoLote', owner);
        b3CertificadoLote = await b3CertificadoLoteFactory.deploy();
        await b3CertificadoLote.deployed();

        // #Router Deploy
        const b3RouterFactory = await ethers.getContractFactory('B3Router', owner);
        b3Router = await b3RouterFactory.deploy(b3CertificadoLote.address, b3Token.address);
        await b3Router.deployed();

        expect(b3Router.address).to.properAddress;
    });

    describe('Sanity tests', () => { 
        it('should have set b3Token', async () => { expect(await b3Router.b3Token()).to.equal(b3Token.address); });
        it('should have set b3Certificate', async () => { expect(await b3Router.b3Certificados()).to.equal(b3CertificadoLote.address); });
    });
});