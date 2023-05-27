// SPDX-FileCopyrightText: 2021 Toucan Labs
//
// SPDX-License-Identifier: LicenseRef-Proprietary

// Explicit import of hardhat plugins are required to obtain type extensions
// when compiling without hardhat.config.ts (e.g. via lint-staged).  Extensions
// are things like 'ethers' on HardhatRuntimeEnvironment.
import '@nomiclabs/hardhat-ethers';
import { Buffer } from 'node:buffer';
import { HardhatUserConfig, HttpNetworkUserConfig } from 'hardhat/types';
import { privateToAddress } from 'ethereumjs-util';
import { task } from 'hardhat/config';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TASK_WHITELIST = [
  'verify'
];

async function loadWalletAddress(): Promise<string> {
  if (!PRIVATE_KEY) {
    console.log('No private key found, set it in .env');
  }

  console.log('Private key found in environment variables');
  const uniformKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY.substring(2, 66) : PRIVATE_KEY;
  const buffer = Buffer.from(uniformKey, 'hex');
  return '0x' + privateToAddress(buffer).toString('hex');
}

export const readOnlyTask = (taskName: string, ...rest: any[]) => {
  TASK_WHITELIST.push(taskName);
  return task(taskName, ...rest);
};

export const defineAccountTask = (config: HardhatUserConfig) => {
  console.log('‍📬 ===');

  readOnlyTask(
    'account',
    'Get balance informations for the deployment account.',
    async (_, { ethers }) => {
      const address = await loadWalletAddress();
      console.log('‍📬 Deployer Account is ' + address);
      for (const n in config.networks) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(
            (<HttpNetworkUserConfig>config.networks[n]).url
          );
          const balance = await provider.getBalance(address);
          console.log(' -- ' + n + ' --  -- -- 📡 ');
          console.log('   balance: ' + ethers.utils.formatEther(balance));
          console.log('   nonce: ' + (await provider.getTransactionCount(address)));
        } catch (e) {
          console.log(e);
        }
      }
    }
  );
};