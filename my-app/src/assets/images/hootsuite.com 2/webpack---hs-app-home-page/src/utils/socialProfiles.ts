import type { Profile, Favorites, Suggested } from 'fe-pnc-data-social-profiles-v2';
import { SocialProfile } from 'typings/SocialProfile';

export function sortSocialProfiles(
  profiles: Profile[],
  disconnectedIds: Set<number>,
  favoriteIds: Set<number>,
  suggestedIds: Set<number>,
): Profile[] {
  const sortedProfiles = [...profiles];

  sortedProfiles.sort((a: Profile, b: Profile) => {
    // A is disconnected, B is not: Sort A before B
    if (disconnectedIds.has(a.socialProfileId) && !disconnectedIds.has(b.socialProfileId)) {
      return -1;
    }

    // B is disconnected, A is not: Sort B before A
    if (disconnectedIds.has(b.socialProfileId) && !disconnectedIds.has(a.socialProfileId)) {
      return 1;
    }

    // A is favorite, B is not: Sort A before B
    if (favoriteIds.has(a.socialProfileId) && !favoriteIds.has(b.socialProfileId)) {
      return -1;
    }

    // B is favorite, A is not: Sort B before A
    if (favoriteIds.has(b.socialProfileId) && !favoriteIds.has(a.socialProfileId)) {
      return 1;
    }

    // A is suggested, B is not: Sort A before B
    if (suggestedIds.has(a.socialProfileId) && !suggestedIds.has(b.socialProfileId)) {
      return -1;
    }

    // B is suggested, A is not: Sort B before A
    if (suggestedIds.has(b.socialProfileId) && !suggestedIds.has(a.socialProfileId)) {
      return 1;
    }

    // Maintain order in all other cases
    return 0;
  });

  return sortedProfiles;
}

export function getDisconnectedProfileIds(disconnectSocialAccountIds: Profile[]): Set<number> {
  const set = new Set<number>();

  disconnectSocialAccountIds.forEach(disconnectedProfile => {
    set.add(disconnectedProfile.socialProfileId);
  });

  return set;
}

export function getFavoriteProfileIds(favorites: Favorites): Set<number> {
  return new Set(favorites.favoriteSocialProfilesIds);
}

export function getSuggestedProfileIds(suggestions: Suggested[]): Set<number> {
  const set = new Set<number>();

  suggestions.forEach(suggested => {
    suggested.privateSocialProfiles.forEach(profile => {
      set.add(profile.socialProfileId);
    });

    suggested.socialProfiles.forEach(profile => {
      set.add(profile.socialProfileId);
    });
  });

  return set;
}
