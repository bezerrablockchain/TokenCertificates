import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const {
  NODE_PROVIDER_MATIC_RPC_URL,
  NODE_PROVIDER_MUMBAI_RPC_URL,
  NODE_PROVIDER_GOERLI_RPC_URL,
  PRIVATE_KEY,
  GAS_LIMIT,
  GAS_PRICE,
  OPTIMIZER_RUNS,
  GAS_REPORT_ENABLED,
  GAS_REPORT_OUTPUT_FILE,
  GAS_REPORT_NO_COLORS,
  POLYGONSCAN_API_KEY,
  CONTRACT_SIZER_ENABLED,
} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: Number(OPTIMIZER_RUNS) || 200,
      },
    },
  },
  networks: {
    mumbai: {
      gas: Number(GAS_LIMIT) || 5000000,
      gasPrice: Number(GAS_PRICE) || 50000000000,
      url: NODE_PROVIDER_MUMBAI_RPC_URL,
      timeout: 120000,
      accounts: [PRIVATE_KEY || ''],
    },
  },
  gasReporter: {
    enabled: GAS_REPORT_ENABLED == 'true',
    currency: 'USD',
    gasPrice: 30,
    coinmarketcap: '',
    excludeContracts: ['contracts/testing/'],
    onlyCalledMethods: true,
    outputFile: GAS_REPORT_OUTPUT_FILE,
    noColors: true,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: CONTRACT_SIZER_ENABLED == 'true',
    strict: true,
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY || '',
      polygonMumbai: POLYGONSCAN_API_KEY || '',
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
