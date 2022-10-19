import {NavigationContext} from '@react-navigation/native';
import React from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Avatar, Text, useTheme} from 'react-native-paper';
import {PlaylistMetadata} from '../../../typings/interfaces';


interface AlbumProps {
	item: PlaylistMetadata;
	loadToManage: (id: string) => void;
}

function PlayList({item, loadToManage}: AlbumProps) {
	const {colors} = useTheme();
	const navigation = React.useContext(NavigationContext);

	const managePlayList = () => {
		loadToManage(item.id);
	};

	return (
		<TouchableOpacity onLongPress={managePlayList}
						  onPress={() => navigation?.navigate('PlaylistContent', {id: item.id})}
						  style={[css.container, {backgroundColor: colors.elevation.level1}]}>
			<View style={css.imageContainer}>
				{item.cover.uri ?
					<Avatar.Image size={50}
								  source={
									  ({size}) => <Image source={{height: size, uri: item.cover.uri, width: size}}
														 style={css.image}/>}/>
					:
					<Avatar.Text label={item.cover.name.split('_')[2].slice(0, 1).toUpperCase()} size={50}/>
				}
			</View>

			<View style={css.textContainer}>
				<Text variant={'titleMedium'}>{item.name}</Text>
				<Text variant={'labelMedium'}>{item.songsCount} {item.songsCount !== 1 ? 'songs' : 'song'}</Text>
			</View>
		</TouchableOpacity>
	);
}

const css = StyleSheet.create({
	container: {
		flexDirection: 'row',
		margin: 5,
		marginBottom: 2.5,
		marginTop: 2.5
	},
	imageContainer: {
		flex: 1,
		padding: 10
	},
	image: {
		borderRadius: 25
	},
	textContainer: {
		flex: 4,
		padding: 10,
		paddingLeft: 0
	}
});

export default PlayList;