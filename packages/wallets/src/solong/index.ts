import { Wallet } from '@project-serum/anchor';
import { Account, PublicKey, Transaction } from '@solana/web3.js';
import EventEmitter from 'eventemitter3';

export class SolongWalletAdapter extends EventEmitter implements Wallet {
  _publicKey: PublicKey | null;
  _onProcess: boolean;
  constructor() {
    super();
    this._publicKey = null;
    this._onProcess = false;
    this.connect = this.connect.bind(this);
  }
  payer: Account;

  get publicKey() {
    return this._publicKey as any;
  }

  async signTransaction(transaction: Transaction) {
    return (window as any).solong.signTransaction(transaction);
  }

  async signAllTransactions(transactions: Transaction[]) {
    return transactions;
  }

  connect() {
    if (this._onProcess) {
      return;
    }

    if ((window as any).solong === undefined) {
      // notify({
      //   message: 'Solong Error',
      //   description: 'Please install solong wallet from Chrome '
      // });
      return;
    }

    this._onProcess = true;
    (window as any).solong
      .selectAccount()
      .then((account: any) => {
        this._publicKey = new PublicKey(account);
        this.emit('connect', this._publicKey);
      })
      .catch(() => {
        this.disconnect();
      })
      .finally(() => {
        this._onProcess = false;
      });
  }

  disconnect() {
    if (this._publicKey) {
      this._publicKey = null;
      this.emit('disconnect');
    }
  }
}
