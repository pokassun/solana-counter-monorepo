import { BN, Idl, Program, Provider, web3 } from '@project-serum/anchor';

import counterIdl from '../../../target/idl/counter.json';

export class CounterProgram {
  network: string;
  programId: web3.PublicKey;
  programData: web3.PublicKey;
  program: Program;

  constructor(provider: Provider) {
    // Todo from env
    this.programId = new web3.PublicKey(
      '9aWEN14iP9Ujmtpg6KMUPDarDPx7gT7dtD6ErPAfopKB'
    );

    // Todo from env
    this.programData = new web3.PublicKey(
      'Gu61tv29dA6crKLAojQFbrrmR8SAGpPWKwjX26MEBSo5'
    );

    // Generate the program client from IDL.
    this.program = new Program(counterIdl as Idl, this.programId, provider);
  }

  async create(): Promise<web3.Account> {
    const counter = new web3.Account();

    await this.program.rpc.create({
      accounts: {
        counter: counter.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY
      },
      signers: [counter],
      instructions: [
        await this.program.account.counter.createInstruction(counter)
      ]
    });

    return counter;
  }

  async getCount(): Promise<number> {
    const counterAccount = await this.program.account.counter(this.programData);
    const count = counterAccount.count as BN;
    return count.toNumber();
  }

  async increment(): Promise<void> {
    await this.program.rpc.increment({
      accounts: {
        counter: this.programData
      }
    });
  }

  async decrement(): Promise<void> {
    await this.program.rpc.decrement({
      accounts: {
        counter: this.programData
      }
    });
  }
}
