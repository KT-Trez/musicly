import {RouteProp, useRoute} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {Appbar, Button, Menu, Text, useTheme} from 'react-native-paper';
import {Musicly} from '../../../../types';
import {RootPlayListsStackParamList} from '../../../../types/navigation';
import TrackAdapter from '../../../classes/TrackAdapter';
import {NewAudioPlayer} from '../../../components/NewAudioPlayer';
import {Song} from '../../../components/Song';
import {Store} from '../../../datastore/Store';
import useCompare from '../../../hooks/useCompare';
import useVisibility from '../../../hooks/useVisibility';
import ResourceManager, {Song as SongC} from '../../../services/ResourceManager';
import RemoveFromPlayListDialog from './RemoveFromPlayListDialog';
import SongsManager from './SongsManager';


type ProfileScreenRouteProp = RouteProp<RootPlayListsStackParamList, 'PlaylistContent'>;

function PlaylistContent() {
	const {colors} = useTheme();
	const route = useRoute<ProfileScreenRouteProp>();
	const playlistID = route.params?.id;

	const [songs, setSongs] = useState<SongC[]>([]);

	const [currentSongID, setCurrentSongID] = useState<string | undefined>();
	const [removeSong, setRemoveSong] = useState<SongC | null>(null);

	const [audioPlayerShows, setAudioPlayerShows] = useState(false);
	const [hideDialog, dialogShows, showDialog] = useVisibility([() => setRemoveSong(null)]);
	const [hideMenu, menuShows, showMenu] = useVisibility();
	const [hideSongsManager, songsManagerShows, showSongsManager] = useVisibility(undefined, [() => hideMenu()]);
	const [hideSort, sortShows, showSort] = useVisibility();

	const getSongs = useCallback(async () => {
		const songArr: SongC[] = [];
		const playListItems = await Store.songPlayLists.findAsync({playListID: playlistID}) as Musicly.Data.SongPlayList[];
		for (const playListItem of playListItems)
			songArr.push(await (await ResourceManager.Song.deserialize(playListItem.songID)).loadPlayList(playListItem));

		setSongs(useCompare(songArr, item => item.musicly.playList?.order ?? item.title));
	}, []);

	// sorting songs
	const sortByTitleAscending = () => {
		setSongs(arr => useCompare(arr, item => item.title));
		hideSort();
	};
	const sortByTitleDescending = () => {
		setSongs(arr => useCompare(arr, item => item.title, true));
		hideSort();
	};

	const sortByDownloadDateAscending = () => {
		setSongs(arr => useCompare(arr, item => item.musicly.file.downloadDate));
		hideSort();
	};
	const sortByDownloadDateDescending = () => {
		setSongs(arr => useCompare(arr, item => item.musicly.file.downloadDate, true));
		hideSort();
	};

	useEffect(() => {
		getSongs();
	}, []);

	useEffect(() => {
		if (removeSong)
			showDialog();
	}, [removeSong]);

	return (
		<View style={[css.container, {backgroundColor: colors.background}]}>
			<Appbar.Header elevated mode={'small'}>
				<Appbar.Content title={songs.length + (songs.length !== 1 ? ' songs' : ' song')}/>

				<Menu anchor={<Appbar.Action icon={'sort'} onPress={showSort}/>}
				      anchorPosition={'bottom'}
				      onDismiss={hideSort}
				      visible={sortShows}>
					<Menu.Item leadingIcon={'sort-calendar-ascending'}
					           onPress={sortByDownloadDateAscending}
					           title={'Asc by date'}/>
					<Menu.Item leadingIcon={'sort-calendar-descending'}
					           onPress={sortByDownloadDateDescending}
					           title={'Dsc by date'}/>
					<Menu.Item leadingIcon={'sort-alphabetical-ascending'}
					           onPress={sortByTitleAscending}
					           title={'Asc by title'}/>
					<Menu.Item leadingIcon={'sort-alphabetical-descending'}
					           onPress={sortByTitleDescending}
					           title={'Dsc by title'}/>
				</Menu>

				<Menu anchor={<Appbar.Action icon={'dots-vertical'} onPress={showMenu}/>}
				      anchorPosition={'bottom'}
				      onDismiss={hideMenu}
				      visible={menuShows}>
					<Menu.Item leadingIcon={'playlist-plus'} onPress={showSongsManager} title={'Add Song'}/>
				</Menu>
			</Appbar.Header>

			{/*<AudioPlayer audioID={currentSongID} setAudioID={setCurrentSongID} songs={songs}/>*/}
			<NewAudioPlayer shows={audioPlayerShows} tracks={songs.map(song => new TrackAdapter(song))}/>
			<Button onPress={() => setAudioPlayerShows(val => !val)}>Audio Player</Button>

			<RemoveFromPlayListDialog hide={hideDialog}
			                          playListID={route.params.id}
			                          refreshSongList={getSongs}
			                          shows={dialogShows}
			                          song={removeSong}/>

			<SongsManager hide={hideSongsManager}
			              playListID={playlistID}
			              refreshPlayList={getSongs}
			              shows={songsManagerShows}/>

			<FlatList data={songs}
			          ListEmptyComponent={
				          <Text style={css.flatListText} variant={'bodyMedium'}>This playlist is empty.</Text>}
			          renderItem={({item}) =>
				          <Song bottomLabel={`${Math.round((item.musicly.file.size ?? 0) / 1024 / 1024 * 100) / 100}MB`}
				                data={item}
				                onPressSelect={setCurrentSongID}
				                onLongPressSelect={() => setRemoveSong(item)}/>}
			          style={css.flatList}/>
		</View>

	);
}

const css = StyleSheet.create({
	container: {
		flex: 1
	},
	flatList: {
		paddingBottom: 2.5,
		paddingTop: 2.5
	},
	flatListText: {
		margin: 15,
		textAlign: 'center'
	}
});

export default PlaylistContent;