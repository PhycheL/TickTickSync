import type { ITask } from '@/api/types/Task';
import type { IProject } from '@/api/types/Project';
import type { IProjectGroup } from '@/api/types/ProjectGroup';
import type { FileMetadata } from '@/services/cacheOperation';
import { settingsStore } from '@/ui/settings/settingsstore';

/**
 * Represents a mapping between an Obsidian folder and a TickTick project/tag.
 * Used to sync tasks from a specific TickTick project (optionally filtered by tag)
 * to a specific file within an Obsidian folder.
 */
export interface IFolderMapping {
	id: string; // Unique ID for the mapping
	obsidianFolder: string; // Path to the Obsidian folder (e.g., "Projects/MyProject")
	tickTickProjectId: string; // Target TickTick Project ID
	tickTickProjectName: string; // Cached project name for UI display
	tickTickTag: string; // Optional tag filter (empty string means no tag filter)
	syncFilename: string; // Specific file to sync with (e.g., "Readme.md")
}

export interface ITickTickSyncSettings {

	baseURL: string;
	token?: string;
	version?: string;
	automaticSynchronizationInterval: number;
	enableFullVaultSync: boolean;
	tagAndOr: number; // 1 == And ; 2 == Or
	SyncProject: string;
	SyncTag: string;
	defaultProjectId: string;
	defaultProjectName: string;
	TickTickTasksFilePath: string;
	keepProjectFolders: boolean;
	syncNotes: boolean;
	noteDelimiter: string;
	fileLinksInTickTick: string;
	taskLinksInObsidian: string;
	bkupFolder: string;


	debugMode: boolean;
	logLevel: string;
	skipBackup?: boolean;

	//TODO look like one cache object
	inboxID: string;
	inboxName: string;
	checkPoint: number;


	fileMetadata: FileMetadata;
	TickTickTasksData: {
		projects: IProject[];
		projectGroups: IProjectGroup[];
		tasks: ITask[];
	};
	folderMappings: IFolderMapping[];
	//statistics: any;
}

export const DEFAULT_SETTINGS: ITickTickSyncSettings = {
	baseURL: 'ticktick.com',
	automaticSynchronizationInterval: 300, //default sync interval 300s
	enableFullVaultSync: false,
	tagAndOr: 1,
	debugMode: false,
	logLevel: 'info',
	SyncProject: '',
	SyncTag: '',
	defaultProjectId: '',
	defaultProjectName: 'Inbox',
	TickTickTasksFilePath: '/',
	keepProjectFolders: false,
	syncNotes: true,
	noteDelimiter: '-------------------------------------------------------------',
	fileLinksInTickTick: 'taskLink',
	taskLinksInObsidian: 'taskLink',
	bkupFolder: '/',

	inboxID: '',
	inboxName: 'Inbox',
	checkPoint: 0,
	skipBackup: false,

	fileMetadata: {},
	TickTickTasksData: {
		projects: [],
		tasks: []
	},
	folderMappings: []

	//statistics: {}
};

//two places for settings, move all ref from main to here

export let settings: ITickTickSyncSettings = { ...DEFAULT_SETTINGS };

export const getSettings = (): ITickTickSyncSettings => {
	return settings;
};

export const setSettings = (value: ITickTickSyncSettings) => {
	settings = value;
};

export const updateSettings = (newSettings: Partial<ITickTickSyncSettings>): ITickTickSyncSettings => {
	settings = { ...settings, ...newSettings } as const;
	settingsStore.set(settings);
	return getSettings();
};

//TODO move to store

// let projects: IProject[] = [];

export const getProjects = (): IProject[] => {
	return settings.TickTickTasksData.projects;
};

export const updateProjects = (newProjects: IProject[]): IProject[] => {
	settings.TickTickTasksData.projects = newProjects;
	return getProjects();
};

// let tasks: ITask[] = [];

export const getTasks = (): ITask[] => {
	return settings.TickTickTasksData.tasks;
};

export const updateTasks = (newTasks: ITask[]): ITask[] => {
	settings.TickTickTasksData.tasks = newTasks;
	return getTasks();
};

// let projectGroups: IProjectGroup[] = [];

export const getProjectGroups = (): IProjectGroup[] => {
	return settings.TickTickTasksData.projectGroups;
};

export const updateProjectGroups = (newProjectGroups: IProjectGroup[]): IProjectGroup[] => {
	settings.TickTickTasksData.projectGroups = newProjectGroups;
	return getProjectGroups();
};
export const getDefaultFolder = (): string => {
	if (settings.TickTickTasksFilePath === '/') {
		return '';
	} else {
		return settings.TickTickTasksFilePath;
	}
};

// Folder Mappings helpers
export const getFolderMappings = (): IFolderMapping[] => {
	return settings.folderMappings || [];
};

export const updateFolderMappings = (newMappings: IFolderMapping[]): IFolderMapping[] => {
	settings.folderMappings = newMappings;
	return getFolderMappings();
};

export const addFolderMapping = (mapping: IFolderMapping): IFolderMapping[] => {
	if (!settings.folderMappings) {
		settings.folderMappings = [];
	}
	settings.folderMappings.push(mapping);
	return getFolderMappings();
};

export const removeFolderMapping = (id: string): IFolderMapping[] => {
	if (!settings.folderMappings) {
		return [];
	}
	settings.folderMappings = settings.folderMappings.filter(m => m.id !== id);
	return getFolderMappings();
};

/**
 * Find a folder mapping that matches the given file path.
 * Returns the mapping if the filepath starts with the obsidianFolder path and matches the syncFilename.
 */
export const findFolderMappingForFilepath = (filepath: string): IFolderMapping | undefined => {
	if (!settings.folderMappings || !filepath) {
		return undefined;
	}
	for (const mapping of settings.folderMappings) {
		const expectedPath = mapping.obsidianFolder.endsWith('/')
			? `${mapping.obsidianFolder}${mapping.syncFilename}`
			: `${mapping.obsidianFolder}/${mapping.syncFilename}`;
		if (filepath === expectedPath) {
			return mapping;
		}
	}
	return undefined;
};

/**
 * Find all folder mappings that match a given TickTick project ID and optionally a tag.
 */
export const findFolderMappingsForProject = (projectId: string, tag?: string): IFolderMapping[] => {
	if (!settings.folderMappings) {
		return [];
	}
	return settings.folderMappings.filter(mapping => {
		const projectMatches = mapping.tickTickProjectId === projectId;
		if (!projectMatches) return false;
		if (tag && mapping.tickTickTag) {
			return mapping.tickTickTag.toLowerCase() === tag.toLowerCase();
		}
		return true;
	});
};
