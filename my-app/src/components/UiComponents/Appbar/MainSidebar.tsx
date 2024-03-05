import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Link } from '@mui/material';

export default function MainSidebar() {

    return (<Box role="presentation">
        <List>
            <ListItem>
                <ListItemButton component="a" href="/create">
                    <ListItemText primary="Create" />
                </ListItemButton>
            </ListItem>
        </List>
    </Box>
    );
}