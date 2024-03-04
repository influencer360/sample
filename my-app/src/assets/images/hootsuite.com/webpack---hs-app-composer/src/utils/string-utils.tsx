/**
 * Truncates string to length and appends suffix
 * @param {String} [suffix]
 * @returns {String}
 */

const truncate = (str, length, suffix = '...') => {
  if (!length || !str || length >= str.length) {
    return str
  }
  let output = str.substr(0, length)
  const lastSpace = output.lastIndexOf(' ')
  if (lastSpace > -1) {
    output = output.substring(0, lastSpace)
  }
  return output + suffix
}

/**
 * Replaces URL in a string with a new URL. Returns updated string
 * Replaces exact url string. Examples:
 * replaceURL("Text and link.com and also link.co", "link.co", "newLink.com") => "Text and link.com and also newLink.com"
 * replaceURL("Text and link.com and also link.co", "link.com", "newLink.com") => "Text and newLink.com and also link.co"
 * @param {String} [str]
 * @param {String} [oldURL]
 * @param {String} [newURL]
 * @returns {String}
 */
const replaceURL = (str, oldURL, newURL): string => {
  let index = 0
  let isMatchFound = false

  // Scan the string for url until exact match found
  while (!isMatchFound) {
    if (index < str.length && str.indexOf(oldURL, index) > -1) {
      // Advance scanning range to deal with duplicate urls
      index = str.indexOf(oldURL, index) + oldURL.length
      const nextCharAfterUrl = str.at(index)
      // If url is followed by a letter - skip (this is not an exact match)
      const isLetter = /[A-Za-z]/.test(nextCharAfterUrl || '')
      if (!isLetter) {
        isMatchFound = true
      }
    } else {
      break
    }
  }
  return isMatchFound
    ? `${str.substring(0, index - oldURL.length)}${newURL}${str.substring(index, str.length)}`
    : str
}

export { replaceURL, truncate }
