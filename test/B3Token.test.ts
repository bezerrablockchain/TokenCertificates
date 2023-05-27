import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { solidity } from 'ethereum-waffle'
import { ethers } from 'hardhat'

import type { B3Token } from '../typechain-types/contracts/B3Token';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity)
chai.use(chaiAsPromised)
const { expect } = chai

describe('B3Token', () => {

    let b3Token: B3Token;
    let owner: SignerWithAddress;
    let regulator: SignerWithAddress;
    let emissor: SignerWithAddress;

    beforeEach(async () => {
        [owner, regulator, emissor] = await ethers.getSigners();
        const b3TokenFactory = await ethers.getContractFactory('B3Token', owner);
        b3Token = await b3TokenFactory.deploy();
        await b3Token.deployed();

        expect(b3Token.address).to.properAddress;
    });

    describe('Sanity tests', () => { 
        it('should have a name', async () => { expect(await b3Token.name()).to.equal('B3Token'); });
        it('should have a symbol', async () => { expect(await b3Token.symbol()).to.equal('B3T'); });
        it('should have 18 decimals', async () => { expect(await b3Token.decimals()).to.equal(18); });
    });
});