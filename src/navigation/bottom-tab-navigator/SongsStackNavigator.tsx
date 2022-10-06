import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {RootSongsStackParamList} from '../../../typings/navigation';
import SongEdit from '../songs-stack-navigator/SongEdit';
import SongsList from '../songs-stack-navigator/SongsList';
import Sync from '../songs-stack-navigator/Sync';


const {Navigator, Screen} = createNativeStackNavigator<RootSongsStackParamList>();

function SongsStackNavigator() {
	const defaultOptions = {
		headerShown: false
	};

	return (
		<Navigator>
			<Screen component={SongsList}
					name={'SongsList'}
					options={defaultOptions}/>
			<Screen component={SongEdit}
					name={'SongEdit'}
					options={defaultOptions}/>
			<Screen component={Sync}
					name={'Sync'}
					options={defaultOptions}/>
		</Navigator>
	);
}

export default SongsStackNavigator;