import { Provider, Wallet, web3 } from '@project-serum/anchor';

import { CounterProgram } from './index';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function newAccountWithLamports(
  connection: web3.Connection,
  lamports = 1000000
): Promise<web3.Account> {
  const account = new web3.Account();

  let retries = 10;
  await connection.requestAirdrop(account.publicKey, lamports);
  for (;;) {
    await sleep(500);
    if (lamports == (await connection.getBalance(account.publicKey))) {
      return account;
    }
    if (--retries <= 0) {
      break;
    }
    console.log(`Airdrop retry ${retries}`);
  }
  throw new Error(`Airdrop of ${lamports} failed`);
}

async function seeder() {
  const connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'recent'
  );
  const payer = await newAccountWithLamports(connection, 10000000);
  const wallet = new Wallet(payer);

  const provider = new Provider(connection, wallet, {
    commitment: 'singleGossip'
  });

  const program = new CounterProgram(provider);

  console.log('create counter account');
  const account = await program.create();

  console.log(
    'Counter ProgramData account, to save inside CounterProgram:',
    account.publicKey.toBase58()
  );

  console.log('current count:', await program.getCount());

  // Test
  // console.log('increment');
  // await counter.increment();
  // console.log('current count:', await counter.getCount());

  // console.log('decrement');
  // await counter.decrement();
  // console.log('current count:', await counter.getCount());
}

seeder().catch(console.error);
