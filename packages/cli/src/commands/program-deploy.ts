import {
  Account,
  BPF_LOADER_PROGRAM_ID,
  BpfLoader,
  Cluster,
  clusterApiUrl,
  Connection,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

import { newAccountWithLamports } from '../utils/new-account-with-lamports';

export default async function main(
  programPath: string,
  programSize: string,
  network: Cluster = 'devnet'
) {
  if (!programPath) {
    console.log('No program path supplied');
    process.exit(1);
  }

  const space = +programSize;

  if (Number.isNaN(space)) {
    console.log('Program size is not a valid number');
    process.exit(1);
  }

  console.log('ProgramPath: ', programPath);
  console.log('ProgramSize: ', space);
  console.log('Deploying on: ', network);

  const url = clusterApiUrl('devnet');
  const connection = new Connection(url, 'recent');

  const version = await connection.getVersion();
  console.log('Connection to cluster established:', url, version);

  const programFullPath = path.join('../', programPath);
  const programDir = path.dirname(programFullPath);

  let fees = 0;
  const { feeCalculator } = await connection.getRecentBlockhash();

  // Calculate the cost to load the program

  const data = fs.readFileSync(programFullPath);

  const NUM_RETRIES = 500; // allow some number of retries
  fees +=
    feeCalculator.lamportsPerSignature *
      (BpfLoader.getMinNumSignatures(data.length) + NUM_RETRIES) +
    (await connection.getMinimumBalanceForRentExemption(data.length));

  // Calculate the cost to fund the greeter account
  fees += await connection.getMinimumBalanceForRentExemption(space);

  // Calculate the cost of sending the transactions
  fees += feeCalculator.lamportsPerSignature * 100; // wag

  const payerAccount = await newAccountWithLamports(connection, fees);
  console.log('PayerAccount publicKey: ', payerAccount.publicKey.toBase58());

  // Create the program account
  const programAccount = new Account();

  await BpfLoader.load(
    connection,
    payerAccount,
    programAccount,
    data,
    BPF_LOADER_PROGRAM_ID
  );

  const programId = programAccount.publicKey;
  console.log('Program deployed: ', programId.toBase58());

  // Create the data account
  const programDataAccount = new Account();
  const programData = programDataAccount.publicKey;

  console.log('Creating data account', programData.toBase58());
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerAccount.publicKey,
      newAccountPubkey: programData,
      lamports,
      space,
      programId
    })
  );
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payerAccount, programDataAccount],
    {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed'
    }
  );

  const configData = JSON.stringify(
    {
      network,
      programId: programId.toBase58(),
      programData: programData.toBase58(),
      programSize
    },
    undefined,
    2
  );

  // Save current deployment
  fs.writeFileSync(path.join(programDir, `config.${network}.json`), configData);
  // Make last deployment as default
  fs.writeFileSync(path.join(programDir, 'config.json'), configData);

  console.log(
    `Program deployed! For program data information check the config file in ${programDir}`
  );
}
