import translation from 'utils/translation';

export default  {
  target: '.rc-MediaPicker',
  placement: 'top-start',
  offset: '25 5',
  title:  translation._('Use your own image'),
  description: translation._('Replace this image by uploading your own or choosing one from the media library. You could even use a video!'),
  spotlightPadding: 3,
  spotlightBorderRadius: 3,
  spotlightTargets: [
    {
      target: '.vk-MessagePreviewArea',
    },
  ],
  next: 'Got it',
}
