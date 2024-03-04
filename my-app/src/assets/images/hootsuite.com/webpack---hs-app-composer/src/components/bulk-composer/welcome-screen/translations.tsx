import React from 'react'
import { A } from 'fe-comp-dom-elements'
import { processString } from 'fe-lib-i18n'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import translation from 'fe-pnc-lib-hs-translation'
import Constants from '@/constants/constants'

const LETS_GET_STARTED = translation._("Let's get started")
const UPLOAD_CSV = translation._('Upload your CSV file')
const DO_NOT_SHORTEN = translation._('Do not shorten links')
// prettier-ignore
const DATES_FORMATTING_MISMATCH = translation._('It looks like the dates in your file match a few different formats.')
const HOW_TO_INTERPRET_DATES = translation._('How should we interpret these dates?')
const REVIEW_MESSAGES = translation._('Review posts')
const HIDE_FORMAT_AND_RULES = translation._('Hide format and rules')
const COLUMN_A = translation._('Column A:')
const DATE_AND_TIME_REQUIRED = translation._('Date and time (required)')
// prettier-ignore
const PLEASE_PROVIDE_BOTH_DATE_AND_TIME = translation._('Please provide both date and time in one of these formats:')
const D_M_Y = translation._('Day/Month/Year Hour:Minute')
const M_D_Y = translation._('Month/Day/Year Hour:Minute')
const Y_M_D = translation._('Year/Month/Day Hour:Minute')
const Y_D_M = translation._('Year/Day/Month Hour:Minute')
// prettier-ignore
const DATE_AND_TIME_10_MINS_IN_FUTURE_REQUIRED = translation._('Date and time must be in the future (at least 10 minutes from upload time).')
// prettier-ignore
const TIME_ENDS_WITH_5_OR_0 = translation._('The time should end with a 5 or a 0. For example, 09:15 or 09:20.')
// prettier-ignore
const ONLY_ONE_MESSAGE_PER_TIME_SLOT = translation._('There should only be one post for every time slot.')
const COLUMN_B = translation._('Column B:')
const MESSAGE_REQUIRED = translation._('Post text (required)')
const DUPLICATE_MESSAGES_NOT_ALLOWED = translation._('Duplicate posts are not allowed.')
const COLUMN_C = translation._('Column C:')
const LINK_OPTIONAL = translation._('Link (optional)')
const MESSAGE_LIMIT = translation._('Post limit:')
// prettier-ignore
const MESSAGE_LIMIT_350_MESSAGES = translation._('There is a limit of 350 posts across all social accounts.')
const MEDIA = translation._('Media:')
const MEDIA_UPLOAD_IN_NEXT_STEP = translation._('You will be able to upload media in the next step.')
const SHOW_FORMAT_AND_RULES = translation._('Show format and rules')
const DOWNLOAD_EXAMPLE_CSV = translation._('Download the example CSV file')
// prettier-ignore
const DOWNLOAD_EXAMPLE_CSV_INSTRUCTIONS = translation._('We recommend using this example as a foundation for crafting your posts.')
const DOWNLOAD_EXAMPLE_CSV_BUTTON = translation._('Download example')
const PROVIDE_MESSAGE_DETAILS = translation._('Fill in the details for your posts')
const MY_MESSAGE = translation._('Your post text here')
const HOW_TO_PREPARE_MESSAGES = translation._('How to prepare your posts')
// prettier-ignore
const NEED_CSV_FILE = translation._('We just need your CSV file and a few details to get your posts prepared for you.')
const NOT_AVAILABLE_IN_THIS_FORMAT = 'Not available in this format'
// prettier-ignore
const CSV_SHOULD_INCLUDE_FIELDS = translation._("Your CSV file should include the following columns. A link is optional. Don't worry if everything isn't perfect, you can fix any errors in the next step.")
// prettier-ignore
const TWITTER_LIMIT_CHARACTERS = translation._('Twitter: There is a limit of %s1 characters. Using a link will reduce the limit to %s2.')
  .replace('%s1', SocialProfileConstants.SN_TYPE_TO_MAX_MESSAGE_LENGTH[SocialProfileConstants.SN_TYPES.TWITTER])
  .replace(
    '%s2',
    SocialProfileConstants.SN_TYPE_TO_MAX_MESSAGE_LENGTH[SocialProfileConstants.SN_TYPES.TWITTER] -
      Constants.twitterUrlLength -
      1,
  )
// prettier-ignore
const TWITTER_LIMIT_CHARACTERS_LINK = translation._('Twitter: Using a link will reduce the number of available characters to %s1.')
  .replace(
    '%s1',
    SocialProfileConstants.SN_TYPE_TO_MAX_MESSAGE_LENGTH[SocialProfileConstants.SN_TYPES.TWITTER] -
      Constants.twitterUrlLength -
      1,
  )
// prettier-ignore
const MAX_CSV_ROWS = translation._('Choosing more than 1 social account will reduce the number of rows allowed in your CSV. For example, choosing 5 social accounts will reduce the maximum CSV rows to 70.')
const DATES_FORMATTING_MISMATCH_TITLE = translation._('Format conflict')
// prettier-ignore
const DATES_FORMATTING_MISMATCH_SUB_TITLE = translation._('Some of your dates have different formats. How should we interpret these dates?')
const IG_PERSONAL_NOT_SUPPORTED_TITLE = translation._('Personal Instagram accounts are not supported')
const generateLink = url => {
  return ({ key, contents }) => (
    <>
      <br />
      <A href={url} key={key}>
        {contents}
      </A>
    </>
  )
}
const generateIGPersonalNotSupportedMessage = () => {
  return processString({
    text: `Bulk Composer doesn't support Instagram Personal accounts or mobile notification publishing. Remove your Personal account or switch it to Business. [ArticleLink]How to switch your account to Business[/ArticleLink]`,
    entities: {
      ArticleLink: generateLink('https://help.hootsuite.com/hc/en-us/articles/1260804251950'),
    },
  })
}

export default {
  LETS_GET_STARTED,
  UPLOAD_CSV,
  DO_NOT_SHORTEN,
  DATES_FORMATTING_MISMATCH,
  HOW_TO_INTERPRET_DATES,
  REVIEW_MESSAGES,
  HIDE_FORMAT_AND_RULES,
  COLUMN_A,
  DATE_AND_TIME_REQUIRED,
  PLEASE_PROVIDE_BOTH_DATE_AND_TIME,
  D_M_Y,
  M_D_Y,
  Y_M_D,
  Y_D_M,
  DATE_AND_TIME_10_MINS_IN_FUTURE_REQUIRED,
  TIME_ENDS_WITH_5_OR_0,
  ONLY_ONE_MESSAGE_PER_TIME_SLOT,
  COLUMN_B,
  MESSAGE_REQUIRED,
  DUPLICATE_MESSAGES_NOT_ALLOWED,
  COLUMN_C,
  LINK_OPTIONAL,
  MESSAGE_LIMIT,
  MESSAGE_LIMIT_350_MESSAGES,
  MEDIA,
  MEDIA_UPLOAD_IN_NEXT_STEP,
  SHOW_FORMAT_AND_RULES,
  DOWNLOAD_EXAMPLE_CSV,
  DOWNLOAD_EXAMPLE_CSV_INSTRUCTIONS,
  DOWNLOAD_EXAMPLE_CSV_BUTTON,
  PROVIDE_MESSAGE_DETAILS,
  MY_MESSAGE,
  HOW_TO_PREPARE_MESSAGES,
  NEED_CSV_FILE,
  NOT_AVAILABLE_IN_THIS_FORMAT,
  CSV_SHOULD_INCLUDE_FIELDS,
  TWITTER_LIMIT_CHARACTERS,
  TWITTER_LIMIT_CHARACTERS_LINK,
  MAX_CSV_ROWS,
  DATES_FORMATTING_MISMATCH_TITLE,
  DATES_FORMATTING_MISMATCH_SUB_TITLE,
  IG_PERSONAL_NOT_SUPPORTED_TITLE,
  generateIGPersonalNotSupportedMessage,
}
