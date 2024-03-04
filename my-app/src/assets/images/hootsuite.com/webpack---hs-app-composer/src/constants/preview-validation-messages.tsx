// Warnings that are displayed as banners in the Media Area
export const ATTACHMENT_WARNINGS_MEDIA_AREA = {
  IG_PUSH_THUMBNAIL_IGNORED: 4115,
  IG_PUSH_PERSONAL_IGNORED: 4116,
}

// All other warnings display in the Preview area, except for these codes
export const IGNORED_PREVIEW_WARNINGS = {
  ...ATTACHMENT_WARNINGS_MEDIA_AREA,
  LI_IMAGE_ASPECT_RATIO: 4110,
  UNSUPPORTED_IMAGE_TYPE: 4216,
  TOO_MANY_IMAGE_ATTACHMENTS: 4202,
  TOO_MANY_ATTACHMENTS: 4261,
}
