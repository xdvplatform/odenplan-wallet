<template>
  <v-content>
    <v-dialog v-model="canRequestTx" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Transaction Request</span>
        </v-card-title>

        <v-card-text>
          <v-form autocomplete="off">
            <v-row>
              <v-col cols="12" md="12">
                <v-textarea
                  label="Payload"
                  class="font-weight-medium"
                  v-model="payload"
                  :disabled="!payload"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="onRequestAction(false)"
            >Reject</v-btn
          >
          <v-btn color="blue darken-1" text @click="onRequestAction(true)"
            >Accept</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="show" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline"
            >Enter passphrase for wallet {{ currentKeystore.name }}</span
          >
        </v-card-title>

        <v-card-text>
          <v-form autocomplete="off">
            <v-row>
              <v-col cols="12" md="12">
                <v-text-field
                  required v-on:keyup.enter="change"
                  v-model="value"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword ? 'text' : 'password'"
                  class="input-group--focused"
                  @click:append="showPassword = !showPassword"
                  :error="!!validations.password"
                  :hint="validations.password"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="cancel">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="change">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-content>
</template>
<script lang="ts">
import { TypedRFE, TasaISC, ISC, Wallet } from 'xdvplatform-wallet/src';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Session } from './Session';
import { Subject } from 'rxjs';
import { KeystoreIndex, DIDSigner } from './KeystoreIndex';
import { ethers } from 'ethers';
@Component({
  name: 'xdv-unlock',
  props: ['value', 'txview', 'wallet'],
  watch: {
    show: async function(current, old) {
      if (old === false && current) {
        const { unlock } = await Session.getSessionInfo();
        if (unlock) {
          //        this.$emit('input', unlock);
          current = false;
        }
      }
    },
  },
})
export default class Unlock extends Vue {
  trackSubscriptions = {};
  value: string;
  txview: boolean;
  show: boolean = false;
  showPassword = false;
  wallet: Wallet;
  validations: any = { password: undefined };
  passphraseSubject: Subject<any> = new Subject();
  payload: any = null;
  canRequestTx: boolean = false;
  accepted: any;
  sub1: any;
  sub2: any;
  sub3: any;
  currentKeystore: KeystoreIndex = new KeystoreIndex();
  async change() {
    this.passphraseSubject.next(this.value);
  }

  async mounted() {
    if (!this.wallet) return;

    const getAddressFromDIDSigner = (
      ks: KeystoreIndex,
      signerReq: DIDSigner
    ) => {
      switch (signerReq) {
        case DIDSigner.Walletconnect:
          return ks.linkedExternalKeystores.walletconnect.address;
        case DIDSigner.Ledger:
          return ks.linkedExternalKeystores.ledger.address;
      }
    };

    // Handle subscriptions
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
    this.sub1 = this.wallet.onSignExternal.subscribe(
      async ({ isDIDSigner, payload, next }) => {
        // const wallets = await Session.getWalletRefs();
        //       const ks = wallets.find(
        //         (i) => i.keystore === this.wallet.id
        //       ) as KeystoreIndex;
        //       const address = getAddressFromDIDSigner(ks, ks.defaultDIDSigner)
        //       if (isDIDSigner && ks.defaultDIDSigner>-1) {
        //         const signature = await Session.sign(
        //           payload,
        //           address,
        //           ks.defaultDIDSigner
        //         );
        //         next({
        //           signature,
        //           isEnabled: true,
        //         });
        //         return;
        //       }
        next({ isEnabled: false });
      }
    );
    this.sub2 = this.wallet.onRequestPassphraseSubscriber.subscribe(
      async (i) => {
        let { currentKeystore, unlock } = await Session.getSessionInfo();
        this.show = false === !!this.wallet.mnemonic;
        this.currentKeystore = currentKeystore;
        if (i.type === 'wallet') {
          if (this.show) {
            this.sub3 = this.passphraseSubject.subscribe(async (passphrase) => {
              await Session.set({
                ks: currentKeystore,
                unlock: true,
              });
              this.wallet.onRequestPassphraseWallet.next({
                type: 'ui',
                passphrase,
              });
            });
          }
        } else if (i.type === 'request_tx') {
          this.canRequestTx = true;
          if (typeof i.payload === 'object') {
            this.payload = JSON.stringify(i.payload);
          } else {
            this.payload = ethers.utils.hexlify(i.payload);
          }
        } else if (i.type === 'error') {
          this.validations.password = 'Invalid passphrase';
        } else if (i.type === 'done') {
          this.validations.password = undefined;
          this.$emit('load');
        }
      }
    );
  }
  cancel() {
    //  no-op
    this.show = false;
  }

  //  @Watch('accepted')
  onRequestAction(accepted) {
    this.wallet.onRequestPassphraseWallet.next({
      type: 'request_tx_response',
      accepted,
    });
    this.canRequestTx = false;
  }
}
</script>
