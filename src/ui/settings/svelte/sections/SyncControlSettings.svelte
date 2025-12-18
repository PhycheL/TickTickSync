<script lang="ts">
  import DefaultsSection from './DefaultsSection.svelte';
  import LimitSyncSection from './LimitSyncSection.svelte';
  import AutoSyncIntervalSection from './AutoSyncIntervalSection.svelte';
  import FullVaultSyncSection from './FullVaultSyncSection.svelte';
  import FolderMapSection from './FolderMapSection.svelte';

  export let plugin;

  const sections = [
    { key: 'defaults', component: DefaultsSection },
    { key: 'limit', component: LimitSyncSection },
    { key: 'auto', component: AutoSyncIntervalSection },
    { key: 'full', component: FullVaultSyncSection },
    { key: 'foldermap', component: FolderMapSection }
  ];

  let openSection: string = 'defaults';

  function handleToggle(sectionKey: string) {
    openSection = openSection === sectionKey ? '' : sectionKey;
  }
</script>

{#each sections as sec}
  <svelte:component
    this={sec.component}
    plugin={plugin}
    open={openSection === sec.key}
    on:toggle={() => handleToggle(sec.key)}
  />
{/each}
