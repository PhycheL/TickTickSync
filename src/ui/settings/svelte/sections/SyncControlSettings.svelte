<script lang="ts">
  import AutoSyncIntervalSection from './AutoSyncIntervalSection.svelte';
  import FolderMapSection from './FolderMapSection.svelte';

  export let plugin;

  const sections = [
    { key: 'foldermap', component: FolderMapSection },
    { key: 'auto', component: AutoSyncIntervalSection }
  ];

  let openSection: string = 'foldermap';

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
