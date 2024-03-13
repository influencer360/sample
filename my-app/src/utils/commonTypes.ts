export type IUserInfoDropdown = {
    id:number;
    userName:string;
    socialIcon:string;
    userAvatar:string;
    socialAccount:string;
}

export type IPostContentType = {
    content:string;
    uploadedFile:string;
};

export type IUserContentType = {content:string;imageFiles:Array<ImgType>;} &IUserInfoDropdown;

export type ImgType = {imgFile:string; id:number};