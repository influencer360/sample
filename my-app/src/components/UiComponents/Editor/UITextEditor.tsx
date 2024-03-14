'use client';
import React from 'react';
import { ContentState, EditorState } from 'draft-js';
import Editor from '@draft-js-plugins/editor';
import createHashtagPlugin from '@draft-js-plugins/hashtag';
import createCounterPlugin from '@draft-js-plugins/counter';
import EmojiPicker from 'emoji-picker-react';
import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import SmileyIcon from '@/assets/icons/smiley-icon.svg';
import { convertFromHTML, convertToHTML } from "draft-convert";
import UiIconButton from '../Button/IconButton';

const hashtagPlugin = createHashtagPlugin({ theme: { hashtag: 'hashtag' } });
const counterPlugin = createCounterPlugin();
// const emojiPlugin = createEmojiPlugin();
const { CharCounter } = counterPlugin;


const StyledEditorContainer = styled(Box)({
    boxSizing: "border-box",
    border: "1px solid #ddd",
    cursor: "text",
    padding: "16px",
    borderRadius: "2px",
    marginBottom: "2em",
    boxShadow: "inset 0px 1px 8px -3px #ABABAB",
    background: "#fefefe",
    '.DraftEditor-root': {
        marginBottom: "0px",
        fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
        lineHeight: 1.4,
        height: "auto",
        boxShadow: "none"
    },
    '.hashtag': {
        color: 'blue'
    },
    '.public-DraftEditorPlaceholder-root': {
        position: 'absolute',
        margin: "24px",
        color: "rgb(80, 76, 77)",
        fontSize: "16px",
        fontStyle: "italic",
        pointerEvents: "none"
    },
    '.DraftEditor-editorContainer': {
        fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
        fontSize: "16px",
        overflowY: "scroll",
        boxSizing: "border-box",
        boxShadow: "none",
        minWidth: "230px",
        minHeight: "250px",
        maxHeight: "550px",
        backgroundColor: "rgb(252, 252, 251)",
        color: "rgb(36, 31, 33)",
        resize: "none",
        verticalAlign: "middle",
        width: "100%",
        zIndex: 0
    },
    ".public-DraftEditor-content": {
        height: "auto",
        minHeight: "102px",
        padding: "24px"
    }
});

const StyledEditorToolbar = styled(Box)({
    display: "flex",
    color: "rgb(36, 31, 33)",
    backgroundColor: "rgb(252, 252, 251)",
    boxSizing: "border-box",
    justifyContent: "space-between",
    alignItems: "center",
    height: "40px",
    fontSize: "16px",
    borderBottom: "1px solid rgb(211, 210, 211)",
    margin: "0px 24px"
});

const StyledCharacterCountWrapper = styled(Box)({
    display: "flex",
    flexFlow: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    color: "rgb(36, 31, 33)",
    fontSize: "16px"
});

const StyledToolbarActionWrapper = styled(Box)({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px"
});



type IProps = { setEditorText: (arg1: string) => void,editorContent:string};


const UiTextEditor = ({ setEditorText,editorContent }: IProps) => {

    const [editorState, setEditorState] = React.useState<EditorState>();
    const [emojiStatus, setEmojiStatus] = React.useState(false);

    const editor = React.useRef<Editor>(null);

    const focusEditor = () => {
        if (editor?.current)
            editor.current.focus();
    };

    const onChange = (editorState: EditorState) => {
        setEditorState(editorState);
        setEditorText(convertToHTML(editorState.getCurrentContent()))
    }

    React.useEffect(() => {
        if(editorContent.length){
            const blocksFromHTML = convertFromHTML(editorContent);
            const state = ContentState.createFromBlockArray(blocksFromHTML.getBlocksAsArray(),blocksFromHTML.getEntityMap());
            setEditorState(EditorState.createWithContent(state));
            focusEditor();

        }
        else{
            setEditorState(EditorState.createEmpty());
            focusEditor();
        }
    }, []);


    return (
        <StyledEditorContainer onClick={focusEditor}>

            {!!editorState && <><Editor
                ref={editor}
                plugins={[hashtagPlugin, counterPlugin]}
                placeholder='Enter your texts and links'
                editorState={editorState}
                onChange={editorState => onChange(editorState)}
            />
                <StyledEditorToolbar>
                    <StyledCharacterCountWrapper>
                        <CharCounter limit={300} />
                    </StyledCharacterCountWrapper>
                    <StyledToolbarActionWrapper className="relative">
                        <UiIconButton onClick={() => setEmojiStatus((value) => !value)}>
                            <SmileyIcon />
                        </UiIconButton>
                        <div className="absolute z-10 right-0 top-10 overflow-y-scroll">
                            {emojiStatus && <EmojiPicker onEmojiClick={(...props) => {
                                console.log(props, 'emojiProps')
                            }} />}
                        </div>
                    </StyledToolbarActionWrapper>
                </StyledEditorToolbar></>}
        </StyledEditorContainer>
    );
};

export default UiTextEditor;