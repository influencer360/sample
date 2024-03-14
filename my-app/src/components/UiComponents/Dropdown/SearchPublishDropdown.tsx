import React, { useState } from 'react';
import { ArrowDown } from '@/assets/icons/';
import UiCheckbox from '../Checkbox/UiCheckbox';
import SocialBadgeAvatar from '../BadgeAvatar/SocialBadgeAvatar';
import styled from '@emotion/styled';
import FavoriteYellowIcon from '@/assets/icons/FavoriteYellowIcon.svg';
import PrivateUserIcon from '@/assets/icons/PrivateUserIcon.svg';
import PlusIcon from '@/assets/icons/plus-icon.svg';
import FavoriteCheckIcon from '@/assets/icons/favorite-checked.svg';
import FavoriteUncheckedIcon from '@/assets/icons/favorite-unchecked.svg';
import CloseIcon from '@/assets/icons/close-icon.svg';
import { useActions, useAppSelector } from '@/lib/hooks';
import { IUserInfoDropdown } from '@/utils/commonTypes';
import { useGetSocialUsersQuery } from '@/lib/api/coreApi';
import UiLoader from '../UiLoader';
import { ClickAwayListener } from '@mui/material';

const StyledUserName = styled('div')({
    color: "rgb(36, 31, 33)",
    fontSize: "20px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    margin: "0px 12px 0px 8px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flex: "1 1 0%"
});

const StyledHeader = styled('p')({
    marginLeft: "8px",
    color: "rgb(36, 31, 33)",
    fontSize: "14px",
    fontWeight: 700
});

const StyledDropdownSectionHeading = styled('div')({
    width: "100%",
    padding: "12px 16px",
    margin: "0px",
    boxSizing: "border-box",
    display: "flex",
    WebkitBoxAlign: "center",
    alignItems: "center"
})

const StyledDropdownSectionContentWrapper = styled('div')({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
    textDecoration: "none",
    width: "100%",
    lineHeight: "20px",
    gap: '10px'
})

const StyledDropdownSectionContent = styled('div')({
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    paddingLeft: "48px",
    width: "100%",
    boxSizing: "border-box",
    flexBasis: '65px',
    '&:hover': { background: "rgb(254, 238, 209)", cursor: "pointer" }
})

const StyledFavoriteCheckboxWrapper = styled('div')({
    width: '40px',
    height: '35px'
});

const StyledAddAccountWrapper = styled('div')({
    paddingLeft: '16px',
    paddingTop: '20px',
    borderTop: '1px solid',
    flexBasis: '65px'
});

const StyledAddAccountText = styled('span')({
    color: "rgb(47, 107, 154)",
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: "20px",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    '&:hover': {
        textDecoration: 'underline'
    }
})


type IPropsDropdown = {
    isLoading: Boolean;
    favorites: Array<IUserInfoDropdown>;
    socialUsers: Array<IUserInfoDropdown>;
    selectedItems: Array<IUserInfoDropdown>;
    favoriteHandler: (id: number) => void;
    selectionHandler: (id: number) => void;
    setDropdown: React.Dispatch<React.SetStateAction<boolean>>
}



const Dropdown = ({ socialUsers, favorites, selectedItems, favoriteHandler, selectionHandler, setDropdown, isLoading }: IPropsDropdown) => {

    const { openUserInfoModal } = useActions();


    return (<ClickAwayListener onClickAway={()=>setDropdown(false)}>
        <div id="dropdown" className="absolute shadow top-100 bg-white z-40 w-full lef-0 rounded max-h-select overflow-y-auto ">
        <div className="flex flex-col w-full" style={{ border: '2px solid #000', borderRadius: '2px' }}>
            {isLoading && <StyledAddAccountWrapper><UiLoader /></StyledAddAccountWrapper>}
            {!isLoading && !favorites.length && !socialUsers.length ? <StyledAddAccountWrapper>
                No social Account added
            </StyledAddAccountWrapper> : <>{!!favorites.length && (<>
                <StyledDropdownSectionHeading>
                    <FavoriteYellowIcon />
                    <StyledHeader>FAVORITES ({`${favorites.length}`})</StyledHeader>
                </StyledDropdownSectionHeading>
                <StyledDropdownSectionContentWrapper>
                    {favorites.map((item, key) => (<StyledDropdownSectionContent key={key}>
                        <UiCheckbox checked={!!selectedItems.find(selected => selected.id === item.id)} onChange={() => selectionHandler(item.id)} />
                        <SocialBadgeAvatar socialIcon={item.socialAccount} userAvatar={item.userAvatar} />
                        <StyledUserName>{item.userName}</StyledUserName>
                        <StyledFavoriteCheckboxWrapper>
                            <UiCheckbox
                                icon={<FavoriteUncheckedIcon />}
                                checkedIcon={<FavoriteCheckIcon />}
                                checked={!!favorites.find(selected => selected.id === item.id)}
                                onChange={() => favoriteHandler(item.id)}
                            />
                        </StyledFavoriteCheckboxWrapper>
                    </StyledDropdownSectionContent>))}
                </StyledDropdownSectionContentWrapper>
            </>)}
                {!!socialUsers.length && (<>
                    <StyledDropdownSectionHeading>
                        <PrivateUserIcon />
                        <StyledHeader>PRIVATE ({`${socialUsers?.length || 0}`})</StyledHeader>
                    </StyledDropdownSectionHeading>
                    <StyledDropdownSectionContentWrapper>
                        {socialUsers.map((item, key) => (<StyledDropdownSectionContent key={key}>
                            <UiCheckbox
                                checked={!!selectedItems.find(selected => selected.id === item.id)}
                                onChange={() => selectionHandler(item.id)}
                            />
                            <SocialBadgeAvatar socialIcon={item.socialAccount} userAvatar={item.userAvatar} />
                            <StyledUserName>{item.userName}</StyledUserName>
                            <StyledFavoriteCheckboxWrapper>
                                <UiCheckbox
                                    icon={<FavoriteUncheckedIcon />}
                                    checkedIcon={<FavoriteCheckIcon />}
                                    checked={!!favorites.find(selected => selected.id === item.id)}
                                    onChange={() => favoriteHandler(item.id)}
                                />
                            </StyledFavoriteCheckboxWrapper>
                        </StyledDropdownSectionContent>))}
                    </StyledDropdownSectionContentWrapper>
                </>)}</>}
            <StyledAddAccountWrapper>
                <StyledAddAccountText onClick={() => openUserInfoModal()}><PlusIcon /> Add a social account</StyledAddAccountText>
            </StyledAddAccountWrapper>
        </div>
    </div>
    </ClickAwayListener>);

};



const SearchPublishDropdown = ({ favorites, selectedUser }: { favorites: Array<IUserInfoDropdown>; selectedUser: Array<IUserInfoDropdown> }) => {
    // state showing if dropdown is open or closed
    const [dropdown, setDropdown] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const { favoriteUserAction, socialUserSelectionAction,addUserContentAction } = useActions();
    const { data: { socialUsers } = {}, isLoading } = useGetSocialUsersQuery();
    const socialContentUsers = useAppSelector(state => state.createPostContent.initialValues.userContent);
    const uploadedFiles = useAppSelector(state => state.createPostContent.initialValues.imageFiles);
    const editorText = useAppSelector(state => state.createPostContent.initialValues.content);

    const favoriteHandler = (id: number) => {
        const filteredItems = favorites.filter((item) => item.id !== id)
        if (filteredItems.length === favorites.length) {
            const item = socialUsers?.find((item) => item.id === id);
            if (item) favoriteUserAction([...favorites, item])
        } else favoriteUserAction(filteredItems);
    }

    const selectionHandler = (id: number) => {

        const filteredItems = selectedUser.filter((item) => item.id !== id)
        const filteredSocialUsers = socialContentUsers.filter((item) => item.id !== id)
        if (filteredItems.length === selectedUser.length) {
            const item = socialUsers?.find((item) => item.id === id)
            if (item){
                socialUserSelectionAction([...selectedUser, item])
                addUserContentAction([...socialContentUsers,{...item,content:editorText,imageFiles:uploadedFiles}])
            } 
        } else {
            socialUserSelectionAction(filteredItems);
            addUserContentAction(filteredSocialUsers)
        }
    }

    React.useEffect(() => {
        if (socialUsers && socialUsers.length) setDropdown(true);

    }, [socialUsers])


    return (
        <div className="w-full flex flex-col items-center mx-auto">
            <div className="w-full relative">
                <div className="flex flex-col items-center">
                    <div className="w-full ">
                        <div className="my-2 p-1 h-12 flex border border-gray-200 bg-white rounded ">
                            <div className="flex flex-auto flex-wrap">
                                {selectedUser.map((tag, index) => {
                                    return (
                                        <div key={index} className="flex justify-center items-center m-1 font-medium py-1 px-2 bg-white rounded-full text-teal-700 bg-teal-100 border border-teal-300 ">
                                            <div className="text-xs font-normal leading-none max-w-full flex-initial">{tag.userName}</div>
                                            <div className="flex flex-auto flex-row-reverse w-5 cursor-pointer">
                                                <div onClick={() => selectionHandler(tag.id)}>
                                                    <CloseIcon />
                                                </div>
                                            </div>
                                        </div>)
                                })
                                }
                                <div className="flex-1">
                                    <input
                                        placeholder={selectedUser.length ? "" : "Select a social account (Required)"}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="bg-transparent p-1 px-2 appearance-none outline-none h-full w-full text-gray-800"
                                    />
                                </div>
                            </div>
                            {!dropdown &&<div className="text-gray-300 w-8 py-1 pl-2 pr-1 border-l flex items-center border-gray-200" onClick={() => setDropdown((value) => !value)}>
                                <button className="cursor-pointer w-6 h-6 text-gray-600 outline-none focus:outline-none">
                                    {ArrowDown}
                                </button>
                            </div>}
                        </div>
                    </div>
                </div>
                {dropdown ?
                    <Dropdown
                        isLoading={isLoading}
                        favorites={favorites}
                        socialUsers={socialUsers || []}
                        selectedItems={selectedUser}
                        favoriteHandler={favoriteHandler}
                        selectionHandler={selectionHandler}
                        setDropdown={setDropdown}
                    /> : <></>}
            </div>
        </div>)
};

export default SearchPublishDropdown;