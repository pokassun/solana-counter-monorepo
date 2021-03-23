import programConfig from '@counter/program/dist/config.json';
import { getConnection, Wallet } from '@counter/solana';
import {
  PublicKey,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js';

export class CounterProgram {
  network: string;
  programId: PublicKey;
  programData: PublicKey;

  constructor() {
    this.network = programConfig.network;
    this.programId = new PublicKey(programConfig.programId);
    this.programData = new PublicKey(programConfig.programData);
  }

  async increment(wallet: Wallet): Promise<void> {
    return this._sendInstruction(wallet, [1]);
  }

  async decrement(wallet: Wallet): Promise<void> {
    return this._sendInstruction(wallet, [2]);
  }

  private async _sendInstruction(
    wallet: Wallet,
    instructionData: number[]
  ): Promise<void> {
    const connection = await getConnection(programConfig.network);
    const recentBlockhash = await connection.getRecentBlockhash();

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: this.programData, isSigner: false, isWritable: true }],
      programId: this.programId,
      data: Buffer.from(instructionData)
    });

    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: recentBlockhash.blockhash
    }).add(instruction);

    const rawTransaction = await wallet.signTransaction(transaction);

    const signature = await connection.sendRawTransaction(
      rawTransaction.serialize()
    );
    await connection.confirmTransaction(signature);
  }
}
