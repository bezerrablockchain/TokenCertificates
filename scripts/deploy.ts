import { ethers } from 'hardhat';

async function main() {

  console.log("ethers: ===> ", ethers.version);

  console.log("💡 Deploying B3Token");
  const B3Token = await ethers.getContractFactory('B3Token');
  const b3Token = await B3Token.deploy();

  await b3Token.deployed();

  console.log(`✅ B3Token deployed to ${b3Token.address}`);
//==========================================================

  console.log("💡 Deploying B3CertificadoLote");
  const B3CertificadoLote = await ethers.getContractFactory('B3Token');
  const b3CertificadoLote = await B3CertificadoLote.deploy();

  await b3CertificadoLote.deployed();

  console.log(`✅ B3CertificadoLote deployed to ${b3CertificadoLote.address}`);
//==========================================================

  console.log("💡 Deploying B3Router");
  const B3Router = await ethers.getContractFactory('B3Router');
  const b3Router = await B3Router.deploy(b3CertificadoLote.address, b3Token.address);

  await b3Router.deployed();

  console.log(`✅ B3Router deployed to ${b3Router.address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
