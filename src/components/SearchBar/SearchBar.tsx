import {MaterialIcons} from '@expo/vector-icons';
import {Box, Icon, Input} from 'native-base';
import React, {useEffect, useState} from 'react';


interface SearchBarProps<T extends object> {
    data: T[];
    placeholder: string;
    // todo: replace with array
    searchFnOne: (item: T) => string;
    searchFnTwo: (item: T) => string;
    setSearchedData: (data: T[]) => void;
}

function SearchBar<T extends object>({
                                         data,
                                         placeholder,
                                         searchFnOne,
                                         searchFnTwo,
                                         setSearchedData
                                     }: SearchBarProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setSearchedData([...data.filter(item => searchFnOne(item).toLowerCase().match(searchQuery.toLowerCase()) || searchFnTwo(item).toLowerCase().match(searchQuery.toLowerCase()))]);
    }, [searchQuery]);

    return (
        <Box bg={'primary.50'}>
            <Input bg={'#fff'}
                   borderRadius={'4'}
                   fontSize={'md'}
                   InputLeftElement={
                       <Icon color='gray.400' m={2} ml={3} size='6' as={<MaterialIcons name='search'/>}/>
                   }
                   m={'auto'}
                   mb={3}
                   mt={3}
                   onChangeText={setSearchQuery}
                   placeholder={placeholder}
                   px={'1'}
                   py={'3'}
                   value={searchQuery}
                   width='94%'
            />
        </Box>
    );
}

export default SearchBar;
