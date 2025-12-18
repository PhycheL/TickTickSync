<script lang="ts">
	import CollapsibleSection from '@/ui/settings/svelte/sections/CollapsibleSection.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		getFolderMappings,
		addFolderMapping,
		removeFolderMapping,
		type IFolderMapping
	} from '@/settings';
	import { Setting } from 'obsidian';
	import { FolderSuggest } from '@/utils/FolderSuggester';
	import ObjectID from 'bson-objectid';
	import log from 'loglevel';

	export let open = false;
	export let plugin;

	const dispatch = createEventDispatcher();

	function handleHeaderClick() {
		dispatch('toggle');
	}

	let mappings: IFolderMapping[] = [];
	let projects: Array<{ id: string; name: string }> = [];
	let myProjectsOptions: Record<string, string> = {};

	// Form state for adding new mapping
	let newFolder = '';
	let newProjectId = '';
	let newTag = '';
	let newFilename = 'Readme.md';

	let showAddForm = false;

	onMount(async () => {
		mappings = getFolderMappings();
		projects = await plugin.service.getProjects?.() ?? [];
		myProjectsOptions = getMyProjectsOptions();
	});

	function getMyProjectsOptions() {
		return projects.reduce((obj, item) => {
			obj[item.id] = item.name;
			return obj;
		}, {} as Record<string, string>);
	}

	function folderInput(element: HTMLElement) {
		const setting = new Setting(element)
			.addSearch((search) => {
				search.setPlaceholder('Select folder')
					.setValue(newFolder);
				new FolderSuggest(search.inputEl, plugin.app);

				search.onChange((value) => {
					newFolder = value;
				});
			});
	}

	async function handleAddMapping() {
		if (!newFolder || !newProjectId) {
			alert('Please select a folder and a project.');
			return;
		}

		const projectName = myProjectsOptions[newProjectId] || '';

		const newMapping: IFolderMapping = {
			id: ObjectID().toHexString(),
			obsidianFolder: newFolder,
			tickTickProjectId: newProjectId,
			tickTickProjectName: projectName,
			tickTickTag: newTag.startsWith('#') ? newTag.substring(1) : newTag,
			syncFilename: newFilename || 'Readme.md'
		};

		addFolderMapping(newMapping);
		await plugin.saveSettings();
		mappings = getFolderMappings();

		// Reset form
		newFolder = '';
		newProjectId = '';
		newTag = '';
		newFilename = 'Readme.md';
		showAddForm = false;

		log.debug('Added folder mapping:', newMapping);
	}

	async function handleRemoveMapping(id: string) {
		removeFolderMapping(id);
		await plugin.saveSettings();
		mappings = getFolderMappings();
		log.debug('Removed folder mapping:', id);
	}

	function toggleAddForm() {
		showAddForm = !showAddForm;
	}

	function getTargetFilePath(mapping: IFolderMapping): string {
		return mapping.obsidianFolder.endsWith('/')
			? `${mapping.obsidianFolder}${mapping.syncFilename}`
			: `${mapping.obsidianFolder}/${mapping.syncFilename}`;
	}
</script>

<CollapsibleSection
	title="Folder Mappings"
	shortDesc="Map Obsidian folders to TickTick projects and tags"
	open={open}
	on:headerClick={handleHeaderClick}
>
	<div class="folder-map-section">
		<div class="setting-item-info">
			<div class="setting-item-description">
				Configure mappings between Obsidian folders and TickTick projects.
				Tasks from the specified TickTick project (optionally filtered by tag)
				will sync to the designated file within each folder.
			</div>
		</div>

		<!-- Existing Mappings List -->
		{#if mappings.length > 0}
			<div class="mappings-list">
				<h4>Current Mappings</h4>
				{#each mappings as mapping}
					<div class="mapping-item">
						<div class="mapping-info">
							<div class="mapping-row">
								<span class="mapping-label">Folder:</span>
								<span class="mapping-value">{mapping.obsidianFolder}</span>
							</div>
							<div class="mapping-row">
								<span class="mapping-label">File:</span>
								<span class="mapping-value">{getTargetFilePath(mapping)}</span>
							</div>
							<div class="mapping-row">
								<span class="mapping-label">Project:</span>
								<span class="mapping-value">{mapping.tickTickProjectName || mapping.tickTickProjectId}</span>
							</div>
							{#if mapping.tickTickTag}
								<div class="mapping-row">
									<span class="mapping-label">Tag:</span>
									<span class="mapping-value">#{mapping.tickTickTag}</span>
								</div>
							{/if}
						</div>
						<button
							class="mapping-delete-btn"
							on:click={() => handleRemoveMapping(mapping.id)}
							title="Remove mapping"
						>
							✕
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="no-mappings">
				No folder mappings configured yet.
			</div>
		{/if}

		<!-- Add New Mapping Button -->
		{#if !showAddForm}
			<div class="add-mapping-btn-container">
				<button class="mod-cta" on:click={toggleAddForm}>
					+ Add Folder Mapping
				</button>
			</div>
		{/if}

		<!-- Add New Mapping Form -->
		{#if showAddForm}
			<div class="add-mapping-form">
				<h4>Add New Mapping</h4>

				<div class="form-row">
					<label class="form-label">Obsidian Folder:</label>
					<div class="form-control folder-suggest-container" use:folderInput></div>
				</div>

				<div class="form-row">
					<label class="form-label">Sync Filename:</label>
					<div class="form-control">
						<input
							type="text"
							class="form-input"
							bind:value={newFilename}
							placeholder="Readme.md"
						/>
					</div>
				</div>

				<div class="form-row">
					<label class="form-label">TickTick Project:</label>
					<div class="form-control">
						<select class="dropdown" bind:value={newProjectId}>
							<option value="">-- Select Project --</option>
							{#each Object.entries(myProjectsOptions) as [id, name]}
								<option value={id}>{name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-row">
					<label class="form-label">TickTick Tag (optional):</label>
					<div class="form-control">
						<input
							type="text"
							class="form-input"
							bind:value={newTag}
							placeholder="e.g., work or #work"
						/>
					</div>
				</div>

				<div class="form-actions">
					<button class="mod-cta" on:click={handleAddMapping}>
						Save Mapping
					</button>
					<button on:click={toggleAddForm}>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>
</CollapsibleSection>

<style>
	.folder-map-section {
		padding: 0.5rem 0;
	}

	.mappings-list {
		margin: 1rem 0;
	}

	.mappings-list h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.mapping-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 1rem;
		margin: 0.5rem 0;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
	}

	.mapping-info {
		flex: 1;
	}

	.mapping-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.mapping-label {
		font-weight: 500;
		color: var(--text-muted);
		min-width: 60px;
	}

	.mapping-value {
		color: var(--text-normal);
	}

	.mapping-delete-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		font-size: 1rem;
		border-radius: 4px;
	}

	.mapping-delete-btn:hover {
		background: var(--background-modifier-error);
		color: var(--text-on-accent);
	}

	.no-mappings {
		padding: 1rem;
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
		background: var(--background-primary);
		border: 1px dashed var(--background-modifier-border);
		border-radius: 6px;
		margin: 1rem 0;
	}

	.add-mapping-btn-container {
		margin-top: 1rem;
		text-align: right;
	}

	.add-mapping-form {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
	}

	.add-mapping-form h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.form-row {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}

	.form-label {
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--text-normal);
	}

	.form-control {
		width: 100%;
	}

	.form-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-secondary);
		color: var(--text-normal);
	}

	.folder-suggest-container :global(.search-input-container) {
		width: 100%;
	}

	.folder-suggest-container :global(input) {
		width: 100%;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}
</style>

