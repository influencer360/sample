import translation from 'utils/translation';

export default  {
  target: '.vk-MessageTextArea',
  placement: 'top-start',
  offset: '25 5',
  title: translation._('Customize the caption'),
  description: translation._('Replace everything in brackets [ ] and make the text your own.'),
  spotlightPadding: 3,
  spotlightBorderRadius: 3,
  hidePrev: false,
  spotlightTargets: [
    {
      target: '.vk-MessagePreviewArea',
    },
  ],
}
