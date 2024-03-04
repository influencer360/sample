import React from 'react';
import FilledLogoFacebook from '@fp-icons/product-logo-filled-facebook';
import FilledLogoFacebookPage from '@fp-icons/product-logo-filled-facebook-page';
import FilledLogoInstagram from '@fp-icons/product-logo-filled-instagram';
import FilledLogoLinkedin from '@fp-icons/product-logo-filled-linkedin';
import FilledLogoPinterest from '@fp-icons/product-logo-filled-pinterest';
import FilledLogoTiktok from '@fp-icons/product-logo-filled-tiktok';
import FilledLogoTwitter from '@fp-icons/product-logo-filled-twitter';
import FilledLogoYoutube from '@fp-icons/product-logo-filled-youtube';
import { Badge } from 'fe-comp-badge';

export const SocialProfileBadge = ({ network, size }: { network: string; size: number }): JSX.Element | null => {
  switch (network) {
    case 'FACEBOOK':
    case 'FACEBOOKGROUP':
      return <Badge glyph={FilledLogoFacebook} size={size} />;
    case 'FACEBOOKPAGE':
      return <Badge glyph={FilledLogoFacebookPage} size={size} />;
    case 'TWITTER':
      return <Badge glyph={FilledLogoTwitter} size={size} />;
    case 'LINKEDIN':
    case 'LINKEDINCOMPANY':
      return <Badge glyph={FilledLogoLinkedin} size={size} />;
    case 'INSTAGRAM':
      return <Badge glyph={FilledLogoInstagram} size={size} />;
    case 'INSTAGRAMBUSINESS':
      return <Badge glyph={FilledLogoInstagram} size={size} />;
    case 'YOUTUBECHANNEL':
      return <Badge glyph={FilledLogoYoutube} size={size} />;
    case 'PINTEREST':
      return <Badge glyph={FilledLogoPinterest} size={size} />;
    case 'TIKTOKBUSINESS':
      return <Badge glyph={FilledLogoTiktok} size={size} />;
    default:
      return null;
  }
};
