import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {FileSystemSessionType} from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {PlaylistMetadata, SavedSongMetadata, SongMetadata} from '../../typings/interfaces';
import PlayListData, {PlayListDataConstructor} from '../classes/PlayListData';
import SongData, {SongDataConstructor} from '../classes/SongData';
import {Store} from '../datastore/Store';
import {Musicly} from '../../typings';
import SongsController from '../datastore/SongsController';
import PlayListController from '../datastore/PlayListController';
import AsyncStorage from '@react-native-async-storage/async-storage';


class Net {
	public static remote = 'https://api-musicly.onrender.com';

	public static readonly axios = axios.create({
		baseURL: this.remote,
		timeout: 20000
	});

	public static async changeRemote(url: string) {
		if (url.endsWith('/'))
			url = url.slice(0, url.length - 1);

		this.axios.defaults.baseURL = url;
		this.remote = url;

		await AsyncStorage.setItem('remote', url);
	}

	public static async loadRemote() {
		const remote = await AsyncStorage.getItem('remote');
		if (remote)
			await this.changeRemote(remote);
	}
}

class PlayList extends PlayListData {
	private static storage = PlayListController.store;

	public static async deserialize(id: string) {
		const playList = await this.storage.findOneAsync({id}) as PlaylistMetadata;

		const options: PlayListDataConstructor = {
			cover: playList.cover,
			flags: playList.flags,
			id: playList.id,
			name: playList.name,
			order: playList.order,
			songsCount: playList.songsCount,
			version: playList.version
		};

		return new PlayList(options);
	}

	public static async deserializeAll() {
		const playLists = await this.storage.findAsync({});

		const playListsArr = [];
		for (const playList of playLists) {
			const options: PlayListDataConstructor = {
				cover: playList.cover,
				flags: playList.flags,
				id: playList.id,
				name: playList.name,
				order: playList.order,
				songsCount: playList.songsCount,
				version: playList.version
			};
			playListsArr.push(new PlayList(options));
		}

		return playListsArr;
	}

	constructor(options: PlayListDataConstructor) {
		super(options);
	}

	async move(order: number, offset: number) {
		await new Promise(resolve => {
			let done = 0;
			PlayList.storage.updateAsync({order}, {$set: {order: this.order + offset}}).then(() => {
				done++;
				if (done == 2)
					resolve(true);
			});
			PlayList.storage.updateAsync({order: order + offset}, {$set: {order}}).then(() => {
				done++;
				if (done == 2)
					resolve(true);
			});
		});
	}

	async removePlayList() {
		const songs = await SongsController.store.findAsync({'musicly.playListsIDs': this.id}) as Musicly.Data.Song[];
		for (const song of songs)
			await SongsController.removeFromPlayList(song.id, this.id);

		await PlayList.storage.removeAsync({id: this.id}, {});
	}

	async updateOrder() {
		await PlayList.storage.updateAsync({id: this.id}, {$set: {order: this.order}});
	}
}

class Song extends SongData {
	private static storage = SongsController.store;

	public static async deserialize(id: string) {
		const song = await this.storage.findOneAsync({id}) as SavedSongMetadata;

		const options: SongDataConstructor = {
			channel: song.channel,
			description: song.description,
			id: song.id,
			metadata: song.metadata,
			musicly: song.musicly,
			title: song.title,
			url: song.url
		};

		return new Song(options);
	}

	public static async deserializeAll() {
		const songs = await this.storage.findAsync({}) as Musicly.Data.Song[];

		const songsArr = [];
		for (const song of songs) {
			const options: SongDataConstructor = {
				channel: song.channel,
				description: song.description,
				id: song.id,
				metadata: song.metadata,
				musicly: song.musicly,
				title: song.title,
				url: song.url
			};
			songsArr.push(new Song(options));
		}

		return songsArr;
	}

	public static async create(data: SongMetadata) {
		const options: SongDataConstructor = {
			channel: data.channel,
			description: data.description,
			id: data.id,
			metadata: data.metadata,
			musicly: {},
			title: data.title,
			url: data.url
		};

		const song = new Song(options);
		await song.updateInDB(true);

		return song;
	}

	// instance
	constructor(options: SongDataConstructor) {
		super(options);
	}

	private async downloadResource(type: 'audio' | 'cover', remoteURL?: string) {
		if (type === 'audio' && this.musicly.flags.isDownloaded)
			throw new Error('audio already downloaded');

		const downloadURL = await ResourceManager.Net.axios({
			responseType: 'json',
			url: '/v2/media/youtube/' + this.id
		});

		// todo: add resumable download
		console.log(remoteURL ?? downloadURL.data.link);

		const ext = type === 'audio' ? '.wav' : '.png';
		return await FileSystem.downloadAsync(remoteURL ?? downloadURL.data.link, FileSystem.cacheDirectory + this.id + ext, {
			cache: true,
			sessionType: FileSystemSessionType.BACKGROUND
		});
	}

	async getRemoteAudio(url?: string) {
		if (!this.musicly)
			throw new Error('song not deserialized');

		const {uri} = await this.downloadResource('audio', url);
		await this.saveAudio(uri);
		await this.updateAudioFileInDB();
	}

	async getRemoteCover(url: string) {
		if (!this.musicly)
			throw new Error('song not deserialized');

		const {uri} = await this.downloadResource('cover', url);
		await this.saveCover(uri);
		await this.updateCoverInDB();
	}

	public async loadPlayList(playList: Musicly.Data.SongPlayList | string) {
		if (typeof playList === 'string')
			this.musicly.playList = await Store.songPlayLists.findOneAsync({
				playListID: playList,
				songID: this.id
			}) as Musicly.Data.SongPlayList;
		else
			this.musicly.playList = playList;

		return this;
	}

	private async saveAudio(uri: string) {
		if (this.musicly.flags.isDownloaded)
			try {
				await FileSystem.deleteAsync(this.musicly.file.path!);
			} catch (err) {
				const asset = await MediaLibrary.getAssetInfoAsync(this.musicly.file.id!);
				await MediaLibrary.deleteAssetsAsync(asset);
			}

		const asset = await MediaLibrary.createAssetAsync(uri);
		const {size} = await FileSystem.getInfoAsync(uri);

		this.musicly.file = {
			downloadDate: new Date(),
			id: asset.id,
			path: asset.uri,
			size
		};
		this.musicly.flags.isDownloaded = true;
	}

	private async saveCover(uri: string) {
		if (this.musicly.flags.hasCover)
			try {
				await FileSystem.deleteAsync(this.musicly.cover.uri!);
			} catch (err) {
				const asset = await MediaLibrary.getAssetInfoAsync(this.musicly.cover.uri!);
				await MediaLibrary.deleteAssetsAsync(asset);
			}

		const asset = await MediaLibrary.createAssetAsync(uri);
		const coverUri = FileSystem.documentDirectory + '/assets/' + this.id + '-thumbnail.png';

		await FileSystem.copyAsync({from: asset.uri, to: coverUri});
		await MediaLibrary.deleteAssetsAsync(asset);

		this.musicly.cover = {
			...this.musicly.cover,
			uri: coverUri
		};
		this.musicly.flags.hasCover = true;
	}

	private async updateAudioFileInDB() {
		await Song.storage.updateAsync({id: this.id}, {
			$set: {
				'musicly.file': this.musicly.file
			}
		});
	}

	private async updateCoverInDB() {
		await SongsController.updateCover(this.id, this.musicly.cover.uri);
	}

	private async updateInDB(upsert?: boolean) {
		// todo: remove musicly.playList before save
		await Song.storage.update({id: this.id}, this, {upsert});
	}
}

export default class ResourceManager {
	static Net = Net;

	static PlayList = PlayList;
	static Song = Song;
}

export {
	PlayList,
	Song
};