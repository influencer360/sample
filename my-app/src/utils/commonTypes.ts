export type IUserInfoDropdown = {
    id:number;
    userName:string;
    socialIcon:string;
    userAvatar:string;
    socialAccount:string;
}

export type IDropdownOptions = {
    favorites:Array<IUserInfoDropdown>;
    private:Array<IUserInfoDropdown>;
}


export type IPostContentType = {
    content:string;
    uploadedFile:string;
}

export type ImgType = {imgFile:string; id:number};