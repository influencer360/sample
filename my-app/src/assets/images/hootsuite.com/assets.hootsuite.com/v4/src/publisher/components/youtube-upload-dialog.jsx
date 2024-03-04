import React from 'react'
import ReactDOM from 'react-dom';
// fe-global components
import { Dialog, Header, Content, Icons } from 'fe-comp-dialog';
import { Lightbox } from 'fe-comp-lightbox';
import { MediaSelectorDropzone } from 'fe-pnc-comp-media-selector';
// utils
import translation from 'utils/translation';
import { uploadToYouTube } from '../youtube';

const SUPPORTED_FILE_EXTENSIONS = ['.mp4', '.m4v'];

const YouTubeUploadDialog = ({ close }) => (
  <Dialog>
    <Icons>
      <Icons.Close close={close} />
    </Icons>
    <Header>
      <Header.Title>{translation._("YouTube Upload")}</Header.Title>
    </Header>
    <Content>
      <MediaSelectorDropzone
        accept={{
          'video/*': SUPPORTED_FILE_EXTENSIONS,
        }}
        link={translation._("or choose a file to upload to YouTube")}
        text={translation._("Drag a video (.mp4 or .m4v) here")}
        onSelect={acceptedFiles => {
          uploadToYouTube(acceptedFiles);
          close();
        }}
      />
    </Content>
  </Dialog>
)

/**
 * Shows the Dialog to upload files to YouTube
 */
const renderYouTubeUploader = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onClose = () => {
    ReactDOM.unmountComponentAtNode(container);
  }

  ReactDOM.render(<Lightbox onClose={onClose}>{YouTubeUploadDialog}</Lightbox>, container);
}

export default renderYouTubeUploader;