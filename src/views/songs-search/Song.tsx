import {MaterialIcons} from '@expo/vector-icons';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Image, LayoutChangeEvent, StyleSheet, ToastAndroid, TouchableOpacity, View} from 'react-native';
import {ActivityIndicator, Text, useTheme} from 'react-native-paper';
import Timestamp from '../../components/Timestamp';
import SongsController from '../../datastore/SongsController';
import * as MediaLibrary from 'expo-media-library';
import ResourceManager from '../../services/ResourceManager';
import {Musicly} from '../../../typings';


interface SongProps {
	item: Musicly.Api.MediaInfo;
}

function Song({item}: SongProps) {
	// todo: !IMPORTANT optimize
	const {colors} = useTheme();
	const songsDB = useRef(new SongsController());

	const [isDownloaded, setIsDownloaded] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const [loadingFailed, setLoadingFailed] = useState(false);

	const [imageDimensions, setImageDimensions] = useState({height: 0, width: 0});

	// todo: measure performance, remove if unnecessary
	const checkDownloadedStatus = useCallback(async () => {
		if (await songsDB.current.countAsync({id: item.id}) > 0)
			setIsDownloaded(true);
	}, []);

	const downloadSong = useCallback(async () => {
		setIsDownloading(true);

		const {status} = await MediaLibrary.requestPermissionsAsync();
		if (status !== MediaLibrary.PermissionStatus.GRANTED) {
			setIsDownloading(false);
			return ToastAndroid.showWithGravity('Can\'t save a file without media library permission.', ToastAndroid.LONG, ToastAndroid.BOTTOM);
		}

		try {
			const song = await ResourceManager.Song.create({
				channel: item.channel,
				description: item.description,
				id: item.id,
				metadata: {
					badges: [],
					duration: {
						accessibility_label: item.metadata.duration.label,
						seconds: item.metadata.duration.seconds,
						simple_text: item.metadata.duration.label
					},
					owner_badges: [],
					published: item.metadata.views.label,
					short_view_count_text: {
						accessibility_label: item.metadata.views.label,
						simple_text: item.metadata.views.label
					},
					thumbnails: item.metadata.thumbnails,
					view_count: item.metadata.views.label
				},
				title: item.title,
				url: ''
			});
			await song.getRemoteAudio();
			await checkDownloadedStatus();
		} catch (err) {
			console.error(err);
			ToastAndroid.showWithGravity('Error, audio file NOT downloaded.', ToastAndroid.LONG, ToastAndroid.BOTTOM);
		} finally {
			setIsDownloading(false);
		}
	}, []);

	const scaleImage = (id: number, event: LayoutChangeEvent) => {
		if (id === 0 && !imageDimensions.width)
			setImageDimensions({height: imageDimensions.height, width: event.nativeEvent.layout.width - 2});
		else if (id === 1 && !imageDimensions.height)
			setImageDimensions({height: event.nativeEvent.layout.height - 2, width: imageDimensions.width});
	};

	useEffect(() => {
		checkDownloadedStatus();
	}, []);

	return (
		<View style={[css.container, {backgroundColor: colors.elevation.level1}]}>
			<View onLayout={(event) => scaleImage(0, event)}
				  style={css.imageContainer}>
				{item.metadata.thumbnails.length === 0 ?
					<View style={css.imageBroken}>
						<MaterialIcons color='gray' name='broken-image' size={30}/>
					</View>
					:
					loadingFailed ?
						<MaterialIcons color='gray' name='error-outline' size={30}/>
						:
						<Image onError={() => setLoadingFailed(true)}
							   resizeMode={'contain'}
							   resizeMethod={'resize'}
							   source={{uri: item.metadata.thumbnails[0].url}}
							   style={{height: imageDimensions.height, width: imageDimensions.width}}/>
				}
				<Timestamp time={item.metadata.duration.label}/>
			</View>
			<View onLayout={(event) => scaleImage(1, event)} style={css.metadataContainer}>
				<Text numberOfLines={2} variant={'titleSmall'}>{item.title + '\n'}</Text>
				<Text numberOfLines={1} variant={'bodySmall'}>{item.channel.name}</Text>
				<Text numberOfLines={1} variant={'labelSmall'}>
					{item.metadata.views.label} • {item.metadata.published}
				</Text>
			</View>
			<TouchableOpacity disabled={isDownloaded || isDownloading}
							  onPress={downloadSong}
							  style={css.addButtonContainer}>
				{!isDownloading ?
					<MaterialIcons color={colors.secondary}
								   name={!isDownloaded ? 'file-download' : 'file-download-done'} size={28}/>
					:
					<ActivityIndicator/>
				}
			</TouchableOpacity>
		</View>
	);
}

const css = StyleSheet.create({
	addButtonContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center'
	},
	container: {
		alignItems: 'center',
		flexDirection: 'row',
		margin: 5,
		marginBottom: 2.5,
		marginTop: 2.5
	},
	imageContainer: {
		alignItems: 'center',
		flex: 3,
		justifyContent: 'center'
	},
	imageBroken: {
		alignItems: 'center',
		backgroundColor: 'lightgray',
		flex: 1,
		justifyContent: 'center',
		width: '100%'
	},
	metadataContainer: {
		flex: 4,
		padding: 5,
		paddingLeft: 10
	}
});

export default Song;