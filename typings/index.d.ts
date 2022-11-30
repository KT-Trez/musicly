import {PlaylistData} from './interfaces';
import {PlayList} from '../src/services/ResourceManager';


export declare module Musicly {
	export module Components {
		export interface ManageDialogOptions {
			isDelete?: boolean;
			isEdit?: boolean;
			isManage?: boolean;
			message?: string;
			playList?: PlayList;
			title?: string;
		}
	}

	export module Data {
		export interface SongMusicly {
			cover: {
				color: string;
				name: string;
				uri: string | undefined;
			},
			file: {
				downloadDate: Date;
				id: string | undefined;
				path: string | undefined;
				size: number | undefined;
			},
			flags: {
				hasCover: boolean;
				isDownloaded: boolean;
				isFavourite: boolean;
			},
			playlists: PlaylistData[];
			version: number;
			wasPlayed: number;
		}

		export interface SongPlayList {
			id: string;
			isFavourite: boolean;
			order: number;
			songID: string;
		}
	}
}