import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { solidity } from 'ethereum-waffle'
import { ethers } from 'hardhat'

import type { B3CertificadoLote } from '../typechain-types/contracts/B3CertificadoLote';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity)
chai.use(chaiAsPromised)
const { expect } = chai

describe('B3CertificadoLote', () => {

    let b3CertificadoLote: B3CertificadoLote;
    let owner: SignerWithAddress;
    let regulator: SignerWithAddress;
    let emissor: SignerWithAddress;

    beforeEach(async () => {
        [owner, regulator, emissor] = await ethers.getSigners();
        const b3CertificadoLoteFactory = await ethers.getContractFactory('B3CertificadoLote', owner);
        b3CertificadoLote = await b3CertificadoLoteFactory.deploy();
        await b3CertificadoLote.deployed();

        expect(b3CertificadoLote.address).to.properAddress;
    });

    describe('Sanity tests', () => { 
        it('should have a name', async () => { expect(await b3CertificadoLote.name()).to.equal('CertificadoLote'); });
        it('should have a symbol', async () => { expect(await b3CertificadoLote.symbol()).to.equal('CTFL'); });
    });
});