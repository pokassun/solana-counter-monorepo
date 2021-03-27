import { Wallet } from '@project-serum/anchor';
import { Account, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import EventEmitter from 'eventemitter3';

export class SolletWallet extends EventEmitter implements Wallet {
  _providerUrl: URL;
  _injectedProvider: any; // TODO: object with post message
  _network: string;
  _publicKey: PublicKey;
  _autoApprove: boolean;
  _handlerAdded: boolean;
  _nextRequestId: number;
  _popup: Window | null;
  _responsePromises: Map<number, [any, any]>;

  constructor(provider, network) {
    super();
    if (isInjectedProvider(provider)) {
      this._injectedProvider = provider;
    } else if (isString(provider) && typeof window !== 'undefined') {
      this._providerUrl = new URL(provider);
      this._providerUrl.hash = new URLSearchParams({
        origin: window.location.origin,
        network
      }).toString();
    } else {
      // throw new Error("provider parameter must be an injected provider or a URL string.");
    }
    this._network = network;
    this._publicKey = null as any;
    this._autoApprove = false;
    this._popup = null;
    this._handlerAdded = false;
    this._nextRequestId = 1;
    this._responsePromises = new Map();
  }
  payer: Account;

  _handleMessage = (e: MessageEvent<any>) => {
    if (
      (this._injectedProvider && e.source === window) ||
      (e.origin === this._providerUrl.origin && e.source === this._popup)
    ) {
      if (e.data.method === 'connected') {
        const newPublicKey = new PublicKey(e.data.params.publicKey);
        if (!this._publicKey || !this._publicKey.equals(newPublicKey)) {
          if (this._publicKey && !this._publicKey.equals(newPublicKey)) {
            this._handleDisconnect();
          }
          this._publicKey = newPublicKey;
          this._autoApprove = !!e.data.params.autoApprove;
          this.emit('connect', this._publicKey);
        }
      } else if (e.data.method === 'disconnected') {
        this._handleDisconnect();
      } else if (e.data.result || e.data.error) {
        if (this._responsePromises.has(e.data.id)) {
          const [resolve, reject] = this._responsePromises.get(e.data.id)!;
          if (e.data.result) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
        }
      }
    }
  };

  _handleConnect = () => {
    if (this._injectedProvider) {
      return new Promise<void>(resolve => {
        this._sendRequest('connect', {});
        resolve();
      });
    } else {
      window.name = 'parent';
      this._popup = window.open(
        this._providerUrl.toString(),
        '_blank',
        'location,resizable,width=460,height=675'
      );
      return new Promise(resolve => {
        this.once('connect', resolve);
      });
    }
  };

  _handleDisconnect = () => {
    if (this._publicKey) {
      this._publicKey = undefined as any;
      this.emit('disconnect');
    }
    this._responsePromises.forEach(([resolve, reject], id) => {
      this._responsePromises.delete(id);
      reject('Wallet disconnected');
    });
  };

  _sendRequest = async (method: string, params) => {
    if (method !== 'connect' && !this.connected) {
      throw new Error('Wallet not connected');
    }
    const requestId = this._nextRequestId;
    ++this._nextRequestId;
    return new Promise<any>((resolve, reject) => {
      this._responsePromises.set(requestId, [resolve, reject] as any);
      if (this._injectedProvider) {
        this._injectedProvider.postMessage({
          jsonrpc: '2.0',
          id: requestId,
          method,
          params: {
            network: this._network,
            ...params
          }
        });
      } else {
        this._popup?.postMessage(
          {
            jsonrpc: '2.0',
            id: requestId,
            method,
            params
          },
          this._providerUrl.origin
        );

        if (!this.autoApprove) {
          this._popup?.focus();
        }
      }
    });
  };

  get publicKey() {
    return this._publicKey;
  }

  get connected() {
    return this._publicKey !== null;
  }

  get autoApprove() {
    return this._autoApprove;
  }

  get publicAddress() {
    return this._publicKey?.toBase58();
  }

  connect = () => {
    if (this._popup) {
      this._popup.close();
    }
    if (!this._handlerAdded) {
      this._handlerAdded = true;
      window.addEventListener('message', this._handleMessage);
      window.addEventListener('beforeunload', this.disconnect);
    }
    return this._handleConnect();
  };

  disconnect = async () => {
    if (this._injectedProvider) {
      await this._sendRequest('disconnect', {});
    }
    if (this._popup) {
      this._popup.close();
    }
    this._handleDisconnect();
  };

  sign = async (data, display) => {
    if (!(data instanceof Uint8Array)) {
      throw new Error('Data must be an instance of Uint8Array');
    }

    const response = await this._sendRequest('sign', {
      data,
      display
    });
    const signature = bs58.decode(response.signature);
    const publicKey = new PublicKey(response.publicKey);
    return {
      signature,
      publicKey
    };
  };

  signTransaction = async (transaction: Transaction) => {
    const response = await this._sendRequest('signTransaction', {
      message: bs58.encode(transaction.serializeMessage())
    });
    const signature = bs58.decode(response.signature);
    const publicKey = new PublicKey(response.publicKey);
    transaction.addSignature(publicKey, signature);
    return transaction;
  };

  signAllTransactions = async (transactions: Transaction[]) => {
    const response = await this._sendRequest('signAllTransactions', {
      messages: transactions.map(tx => bs58.encode(tx.serializeMessage()))
    });
    const signatures = response.signatures.map(s => bs58.decode(s));
    const publicKey = new PublicKey(response.publicKey);
    transactions = transactions.map((tx, idx) => {
      tx.addSignature(publicKey, signatures[idx]);
      return tx;
    });
    return transactions;
  };
}

function isString(a) {
  return typeof a === 'string';
}

function isInjectedProvider(a) {
  return isObject(a) && isFunction(a.postMessage);
}

function isObject(a) {
  return typeof a === 'object' && a !== null;
}

function isFunction(a) {
  return typeof a === 'function';
}
