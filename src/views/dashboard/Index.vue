<template>
  <v-app>
    <dashboard-core-app-bar />
    <!-- <dashboard-core-drawer v-if="canInit" /> -->
    <dashboard-core-view />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'DashboardIndex',
  components: {
    DashboardCoreAppBar: () => import('./components/core/AppBar.vue'),
    DashboardCoreView: () => import('./components/core/View.vue'),
  },
})
export default class DashboardIndex extends Vue {
  solidoProps = { db: null, contracts: null };
  onboarding = null;
  onboard = null;
  defaultNetwork = 3;
  startOnboarding = null;
  onboardSync = {
    address: this.handleAddressChange,
    network: this.handleNetworkChange,
    balance: this.handleBalanceChange,
    wallet: this.handleWalletChange,
  };
  _network = 3;
  _address = '';
  canInit = false;

  get address() {
    return localStorage.getItem('address');
  }
  set address(value) {
    localStorage.setItem('address', value);
  }
  get network() {
    return +localStorage.getItem('network');
  }
  set network(value: number) {
    localStorage.setItem('network', value.toString());
  }
  handleAddressChange(address) {
    this.address = address;
  }

  async handleNetworkChange(networkId) {
    this.network = networkId;
  }

  handleBalanceChange(balance) {}

  handleWalletChange(wallet) {
    localStorage.setItem('selectedWallet', wallet.name);
  }

  async mounted() {
    this.canInit = true;
  }
}
</script>
