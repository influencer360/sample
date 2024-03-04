import axios from 'fe-axios'
import { logError } from 'fe-lib-logging'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { actions as pinterestActions } from 'fe-pnc-data-pinterest'
import { getPinterestBoards } from 'fe-pnc-lib-api'
import translation from 'fe-pnc-lib-hs-translation'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import ComposerUtils from '@/utils/composer-utils'

const mapTargetsToBoards = (socialNetworkId, targets, username) => {
  if (!Array.isArray(targets)) {
    targets = []
  }
  return targets.map(target => {
    return {
      username: username,
      socialNetworkId,
      boardId: target.id,
      boardName: target.name,
      privacy: target.privacy,
    }
  })
}

const fetchPinterestBoardsForProfile = (profileId, pageToken, username, statusObject) => {
  return getPinterestBoards(profileId, pageToken)
    .then(data => {
      const boards = mapTargetsToBoards(profileId, data.targets, username)
      pinterestActions.concatPinterestBoards(boards)

      if (data.pageToken) {
        fetchPinterestBoardsForProfile(profileId, data.pageToken, username, statusObject)
      }
    })
    .catch(error => {
      if (!axios.isCancel(error)) {
        logError(LOGGING_CATEGORIES.NEW_PIN, 'Failed to fetch boards for profile', {
          errorMessage: JSON.stringify(error.message),
          stack: JSON.stringify(error.stack),
        })
        statusObject.update(translation._('Unable to retrieve boards'), 'error', true)
      }
    })
}

// no need to check for Pinterest because we only fetch boards for Pinterest profiles (no Pinterest profiles, no data fetch)
const loadAllPinterestBoards = async (
  socialNetworks,
  selectedOrganization,
  statusObject,
  onFetchSocialProfiles,
  setIsFetchingPinterestBoards,
) => {
  const pinterestProfiles = ComposerUtils.getAvailableProfiles(
    socialNetworks,
    selectedOrganization,
    SocialProfileConstants.SN_TYPES.PINTEREST,
  )
  const promises = []
  setIsFetchingPinterestBoards(true)
  pinterestProfiles.forEach(pinterestProfile => {
    promises.push(
      fetchPinterestBoardsForProfile(
        pinterestProfile.socialNetworkId,
        null,
        pinterestProfile?.username,
        statusObject,
      ),
    )
  })
  await Promise.all(promises)
  setIsFetchingPinterestBoards(false)
  onFetchSocialProfiles()
}

const reloadAllPinterestBoards = (
  customContext,
  socialNetworks,
  selectedOrganization,
  statusObject,
  onFetchSocialProfiles,
  setIsFetchingPinterestBoards,
) => {
  if (ComposerUtils.isPinterestComposer(customContext)) {
    pinterestActions.resetPinterestBoards()
    loadAllPinterestBoards(
      socialNetworks,
      selectedOrganization,
      statusObject,
      onFetchSocialProfiles,
      setIsFetchingPinterestBoards,
    )
  }
}

const getCommaSeparatedList = strings => {
  if (strings.length === 0) {
    return ''
  }
  if (strings.length === 1) {
    return strings.pop()
  }
  const lastStringSeparator = strings.length === 2 ? ' and ' : ', and '
  const lastString = strings.pop()
  return [strings.join(', '), lastString].join(lastStringSeparator)
}

const handleCreateBoardComplete = (responses, boardName, error, statusObject) => {
  if (error || !responses) {
    statusObject.update(translation._('An unknown error occured. Please try again.'), 'error', true)
    return false
  }

  // all requests failed
  if (responses.every(response => response.errors)) {
    statusObject.update(
      translation._('Unable to create board "%d" on any accounts').replace('%d', boardName),
      'error',
      true,
    )
    return false
  }

  const successResponseUsernames = responses
    .filter(response => !response.errors)
    .map(response => response.profile.username)

  const failResponseUsernames = responses
    .filter(response => response.errors)
    .map(response => response.profile.username)

  const didAllRequestsSucceed = failResponseUsernames.length === 0
  if (didAllRequestsSucceed) {
    statusObject.update(
      translation
        ._('The board "%d1" was successfully created for %d2')
        .replace('%d1', boardName)
        .replace('%d2', getCommaSeparatedList(successResponseUsernames)),
      'success',
      true,
    )
    // some requests succeeded, some requests failed
  } else {
    statusObject.update(
      translation
        ._('Unable to create board "%d1" for %d2. The board was successfully created for %d3')
        .replace('%d1', boardName)
        .replace('%d2', getCommaSeparatedList(failResponseUsernames))
        .replace('%d3', getCommaSeparatedList(successResponseUsernames)),
      'warning',
      true,
    )
  }
  return true
}

export {
  mapTargetsToBoards,
  reloadAllPinterestBoards,
  loadAllPinterestBoards,
  fetchPinterestBoardsForProfile,
  getCommaSeparatedList,
  handleCreateBoardComplete,
}
