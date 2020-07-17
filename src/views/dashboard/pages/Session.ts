import moment from 'moment';
import PouchDB from 'pouchdb';
import QRCodeModal from '@walletconnect/qrcode-modal';
import WalletConnect from '@walletconnect/client';
import { DIDDocument, Wallet } from 'xdvplatform-wallet/src';
import { DIDSigner, KeystoreIndex } from './KeystoreIndex';
import { IsEthereumAddress, IsNumber, IsString } from 'class-validator';

PouchDB.plugin(require('pouchdb-find'));

const WALLET_REFS_KEY = 'xdv:wallet:refs';
const TOKENS_KEY = 'xdv:tokens';

export class Session {
    static timeout;
    static walletConnect: WalletConnect;
    static db = new PouchDB('xdv:session');


    /**
     * Gets keystore from session db
     */
    static async getSessionInfo(): Promise<{
        currentKeystore: KeystoreIndex;
        unlock: boolean;

    }> {
        try {
            const item = await this.db.get('xdv:session');
            return { ...item } as any;
        } catch (e) {
            return { currentKeystore: null, unlock: null };
        }
    }

    /**
     * Sets a keystore index, if keystore is diff, then clears unlock (unlock set to false)
     * @param ks 
     */
    static async set({ ks, unlock = undefined }: any & {
        ks: KeystoreIndex;
        unlock: any;
    }) {
        const templ = {
            _id: 'xdv:session',
            currentKeystore: ks,
            unlock,
            timestamp: new Date(),
        };
        try {
            let ref: any & {
                currentKeystore: KeystoreIndex;
                unlock: boolean;

            } = await this.db.get('xdv:session');
            if (ks.keystore !== ref.currentKeystore.keystore) {
                // if diff, then clear unlock=false
                ref = await this.db.put({
                    _id: 'xdv:session',
                    _deleted: true,
                    _rev: ref._rev,
                });
            }
            // @ts-ignore
            templ._rev = ref._rev;
            if (unlock !== undefined) {
                templ.unlock = unlock;
            }
            return this.db.put(templ);
        } catch (e) {
            return this.db.put(templ);

        }
    }

    /**
     * Checks to see if there are available wallets
     */
    static async hasWalletRefs() {
        try {
            const item = await this.db.get(WALLET_REFS_KEY);
            return !!item;

        } catch (e) {
            return false;
        }
    }

    static async getWalletRefs() {
        const doc: any = await this.db.get(WALLET_REFS_KEY);
        return Object.values(doc.refs);
    }

    /**
     * Sets wallet keystore
     * @param ks Keystore Item
     * @param update if update otherwise create
     */
    static async setWalletRefs(ks: KeystoreIndex, update: boolean = false) {

        try {
            const ref: any = await this.db.get(WALLET_REFS_KEY);
            return this.db.put({
                _id: WALLET_REFS_KEY,
                refs: { ...ref.refs, [ks.keystore]: ks },
                _rev: ref._rev,
                timestamp: new Date(),
            });
        } catch (e) {
            return this.db.put({
                _id: WALLET_REFS_KEY,
                refs: { [ks.keystore]: ks },
                timestamp: new Date(),
            });

        }
    }


    static async getTokens({ chain }) {
        const tokens: any = await this.db.get(TOKENS_KEY);
        if (tokens) {
            return Object.values(tokens).filter(i => i.chain === chain );
        } else {
            return Object.values(tokens);

        }
    }

    /**
     * Sets tokens
     * @param token Token
     * @param update if update otherwise create
     */
    static async setTokens(token: Token, update: boolean = false) {

        try {
            const ref: any = await this.db.get(TOKENS_KEY);
            return this.db.put({
                _id: TOKENS_KEY,
                ...ref,
                [token.symbol]: token,
                _rev: ref._rev,
                timestamp: new Date(),
            });
        } catch (e) {
            return this.db.put({
                _id: TOKENS_KEY,
                [token.symbol]: token,
                timestamp: new Date(),
            });

        }
    }
}

export class Token {
    @IsString()
    name: string;
    
    @IsString()
    symbol: string;
    
    @IsNumber()
    decimals: number;
    
    @IsString()
    chain: string;

    @IsEthereumAddress()
    address: string;

    @IsString()
    network: string;

    totalSupply: number;

    icon: string;
    
    constructor() {}
}