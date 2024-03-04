/**
 * @preventMunge
 */

import moment from 'moment-timezone'
import PapaParse from 'papaparse'
import _ from 'underscore'
import Constants from '@/constants/constants'
import { Output, ParsedDates } from '@/typings/BulkComposer'
import DatePartValidator from './date-part-validator'

const dayToken = '(?:mon|tue|wed|thu|fri|sat|sun)'
const validToken =
  '(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sept|sep|september|oct|october|nov|november|dec|december|\\d{1,4})'
const separatorToken = '([^0-9a-zA-Z]+)'
const dateRegexString =
  '(?:' +
  dayToken +
  '.*?)?' +
  validToken +
  separatorToken +
  validToken +
  separatorToken +
  validToken +
  separatorToken +
  validToken +
  separatorToken +
  validToken +
  '(.*)'
const dateRegex = new RegExp(dateRegexString, 'i')

const BulkMessageDateUtils = {
  /**
   * Given a map from formats to their quality (0 to 1), returns a sorted array of formats, in priority order.
   * This method handles special cases, such as filtering only to 100% quality formats if they're available
   * @param {object.<string, number>} rankedFormats The formats ranked by quality, as in parseDatesFromLines(...).formats
   * @param {object.<int, {dateString: string, parsedFormats: object.<string, int>}>} parsedDates The parsed dates as output from parseDatesFromLines(...).parsedDates
   * @return {string[]}
   */
  getPrioritizedFormats(rankedFormats, parsedDates: ParsedDates) {
    // Zip into pairs of [format, quality]
    const formatDescendingSort = function (a, b) {
      if (a[1] > b[1]) {
        return -1
      } else {
        return a[1] < b[1] ? 1 : 0
      }
    }

    const formatAscendingSort = function (a, b) {
      if (a[1] > b[1]) {
        return 1
      } else {
        return a[1] < b[1] ? -1 : 0
      }
    }

    let sortedPairs = _.pairs(rankedFormats).sort(formatDescendingSort)

    // If there is at least 1 format with 100% quality, we only show other formats that also have 100% quality
    if (sortedPairs[0] && sortedPairs[0][1] === 1) {
      sortedPairs = sortedPairs.filter(pair => pair[1] === 1)

      if (typeof parsedDates === 'object' && Object.keys(parsedDates).length > 0) {
        // Sort the remaining 100% matches in order of dates: If a format results in earlier dates, show it first
        // The first format definitely matches the 100% formats - first lets filter out any non-100% formats and create a new sortedPairs from formats to timestamps
        const formatsWith100Percent = sortedPairs.map(pair => pair[0])
        const unsortedPairs = _.pairs(parsedDates[Object.keys(parsedDates)[0]].parsedFormats).filter(pair =>
          _.contains(formatsWith100Percent, pair[0]),
        )

        // now sort them to smallest first
        sortedPairs = unsortedPairs.sort(formatAscendingSort)
      }
    }

    // We only care about the formats now that they're sorted
    return sortedPairs.map(pair => pair[0])
  },

  /**
   * Given the text of a file, parses it into 'lines'. These are actually rows, not lines, as each row might contain newlines and returns.
   * @param fileText The string text of the file
   * @returns An array of lines, each corresponding to 1 message.
   */
  parseLinesFromFile(fileText: string): Array<string> {
    return PapaParse.parse<Array<string>>(fileText).data.map(subArray => subArray.join(','))
  },

  /**
   * Given the lines of a csv file, will attempt to identify what date formats are used in the file, and how well each format matches
   * the entire data set (eg: format x matches 82% of the dates).
   * Example output:
   * {
   *   formats: {
   *     ymd: 0.46,
   *     ydm: 0.98
   *   },
   *   parsedDates: {
   *     4: {
   *       dateString: 'user supplied date',
   *       parsedFormats: {
   *         ymd: Date|null
   *         ydm: Date|null
   *       }
   *     }
   *   },
   *   errors: {
   *     41: 'Invalid format (hour must be between 0 and 23)',
   *   },
   *   labels: {
   *     ymd: 'yyyy-mm-dd hh:mm',
   *     ydm: 'yyyy/dd/mm hh:mm'
   *   }
   * }
   * @param lines The lines from a csv file. For example, the result of (new FileReader()).readAsText(fileBlob)
   * @param timezoneName The users hs timezone name
   * @param minimumDate The minimum datetime for a date to be considered valid. Defaults to the current datetime
   * @return An object with several keys, see above for an example
   */
  parseDatesFromLines(lines: Array<string>, timezoneName: string, minimumDate: Date = new Date()): Output {
    let output = {
      formats: {},
      errors: {},
      parsedDates: {},
      labels: {},
    } as Output
    let nonEmptyLineCount = 0

    output = lines.reduce((acc, line, lineIndex) => {
      // Ignore empty lines
      if (line === '') {
        return acc
      }

      nonEmptyLineCount++

      // Store errors
      const result = BulkMessageDateUtils.getDateFormatsFromLine(line, timezoneName, minimumDate)
      if (typeof result === 'string') {
        acc.errors[lineIndex + 1] = result
        return acc
      }

      // Add the format results to the total results for each format
      Object.keys(result.formats).forEach(format => (acc.formats[format] = (acc.formats[format] || 0) + 1))

      // If this is the first time we've seen the format, store the user friendly label for it
      Object.keys(result.formatToLabel).forEach(format => {
        if (typeof output.labels[format] !== 'string') {
          output.labels[format] = result.formatToLabel[format]
        }
      })

      // Add the original users string and the parsed formats to the result
      acc.parsedDates[lineIndex + 1] = {
        dateString: result.dateString,
        parsedFormats: result.formats,
      }

      return acc
    }, output)

    // Convert the counts into percentages for each format
    Object.keys(output.formats).forEach(format => {
      output.formats[format] =
        Math.round((output.formats[format] / nonEmptyLineCount + 0.000001) * 1000) / 1000
    })

    return output
  },

  /**
   * Given a line of a csv, this function tries to find a date, and if found, determines which date formats apply to it.
   * The allowed formats are dmy, mdy, ymd, ydm
   * If the year is two digits, then we only allow the format d m y or y m d, and only if the month is a string
   * The success response looks like:
   * {
   *   dateString: 'whatever date the user provided',
   *   formats: {
   *     dmy: date: Date|null, // A date object, or null if the date was invalid
   *     mdy: date: Date|null // A date object, or null if the date was invalid
   *   }
   * }
   *
   * @param line A line from a csv
   * @param timezoneName The users hs timezone name
   * @param minimumDate The minimum date for values to be considered valid. Normally set to current time.
   * @return A String if there is a hard error, or an object mapping formats to result data
   */
  getDateFormatsFromLine(
    line: string,
    timezoneName: string,
    minimumDate: Date,
  ): string | Record<string, unknown> {
    const matches = line.match(dateRegex)
    if (!Array.isArray(matches) || matches.length < 7) {
      return 'Cannot determine format (unrecognizable format)'
    }

    let day = matches[1]
    const separator1 = matches[2]
    let month = matches[3]
    const separator2 = matches[4]
    let year = matches[5]
    const separator3 = matches[6]
    let hour = matches[7]
    const separator4 = matches[8]
    let minute = matches[9]
    const extra = matches[10]
    // extra contains everything, but when we display the original date to the user, we want to filter out anything that isn't the date
    // we also only check the date part for pm indicators
    // we can't simply do a line.split(','), because some valid dates have commas
    const restOfDate = extra.split(',')[0]
    const userProvidedDate = extra === '' ? matches[0] : matches[0].split(extra)[0] + restOfDate
    // Example:
    // Original:     "Tuesday, 1/13/2015 6:00:00 pm, http://hootsuite.com/1234, hello"
    // Extra:        ":00 pm, http://hootsuite.com/1234, hello"
    // RestOfDate:   ":00 pm"
    // UserProvided: "Tuesday, 1/13/2015 6:00:00 pm"

    const numFieldsThatAreStrings = [day, month, year].filter(isNaN).length

    /* First let's fail fast on any hard errors */

    // If there are multiple text fields, something is wrong with the input
    if (numFieldsThatAreStrings > 1) {
      return 'Cannot determine format (too many fields are strings)'
    }

    // Expect there to be only one 4 digit number
    if (day > 999 && year > 999) {
      return 'Cannot determine format (year and day are invalid)'
    }

    /* Then let's see if we can remove any permutations of the format */

    let permutations = ['ymd', 'ydm', 'mdy', 'dmy']

    // If the month is text, convert it and rule out some permutations
    if (isNaN(day)) {
      day = Constants.MONTHS[day.toUpperCase().slice(0, 3)]
      permutations = permutations.filter(perm => perm[0] === 'm')
    } else if (isNaN(month)) {
      month = Constants.MONTHS[month.toUpperCase().slice(0, 3)]
      permutations = permutations.filter(perm => perm[1] === 'm')
    } else if (isNaN(year)) {
      year = Constants.MONTHS[year.toUpperCase().slice(0, 3)]
      permutations = permutations.filter(perm => perm[2] === 'm')
    }

    // If there is a 4 digit number, we can rule out some more permutations
    // We could also try to disambiguate the day and month if we know the year, but performance-wise it's not worth it
    if (day > 999) {
      permutations = permutations.filter(perm => perm[0] === 'y')
    } else if (year > 999) {
      permutations = permutations.filter(perm => perm[2] === 'y')
    }

    // If any field is more than 12, it can't be a month
    if (day > 12) {
      permutations = permutations.filter(perm => perm[0] !== 'm')
    }
    if (month > 12) {
      permutations = permutations.filter(perm => perm[1] !== 'm')
    }
    if (year > 12) {
      permutations = permutations.filter(perm => perm[2] !== 'm')
    }

    /* Handle PM and 24 hour time, and cast everything to integers */

    year = parseInt(year, 10)
    month = parseInt(month, 10)
    day = parseInt(day, 10)
    hour = parseInt(hour, 10)

    // If it's pm AND the hour is before 12, then convert it to 24hr time
    if (hour < 12 && restOfDate.toLowerCase().indexOf('pm') > -1) {
      hour = hour + 12
    }

    // If it's 12:XX then converting to 24hr time is a little different
    if (hour === 12 && restOfDate.toLowerCase().indexOf('am') > -1) {
      hour = hour - 12
    }

    minute = parseInt(minute, 10)

    // Now we've got a potentially reduced set of permutations, so let's now test them and return the results
    let lastValidationResult = true
    const validator = new DatePartValidator(minimumDate)
    const formatToLabelMap = {} // we're going to do a double reduction, storing the labels alongside the formats that are valid
    const bruteFormatMap = permutations.reduce((acc, perm) => {
      // We parsed it as dmy, so if it doesn't match that, we need to shuffle accordingly
      const newParts = perm.split('').reduce((newPartsAcc, next, i) => {
        newPartsAcc[next] = [day, month, year][i]
        return newPartsAcc
      }, {})

      lastValidationResult = validator.isValidDateOrErrorMessage(
        BulkMessageDateUtils.makeYear4Digits(newParts.y),
        newParts.m,
        newParts.d,
        hour,
        minute,
      )
      if (lastValidationResult === true) {
        const labelForParts = perm
          .split('')
          .map(part => (part === 'y' && newParts.y > 999 ? 'yyyy' : part + part)) // mm, dd, yy or yyyy
        formatToLabelMap[perm] =
          labelForParts[0] +
          separator1 +
          labelForParts[1] +
          separator2 +
          labelForParts[2] +
          separator3 +
          'hh' +
          separator4 +
          'mm'
        if (restOfDate.toLowerCase().indexOf('pm') > -1) {
          formatToLabelMap[perm] += ' pm'
        } else if (restOfDate.toLowerCase().indexOf('am') > -1) {
          formatToLabelMap[perm] += ' am'
        }

        const localDate = new moment.tz(timezoneName)

        localDate
          .year(BulkMessageDateUtils.makeYear4Digits(newParts.y))
          .month(newParts.m - 1)
          .date(newParts.d)
          .hour(hour)
          .minute(minute)
          .second(0)
          .millisecond(0)

        acc[perm] = localDate.valueOf()
      }

      return acc
    }, {})

    // If there is only 1 permutation remaining and it fails, then give the user more specific information about what went wrong
    // Otherwise just say that we couldn't find any valid permutations
    if (Object.keys(bruteFormatMap).length === 0) {
      if (permutations.length === 1) {
        return lastValidationResult
      }
      return 'Invalid Date: Could not find any format that matches the given date'
    }

    return {
      dateString: userProvidedDate,
      formats: bruteFormatMap,
      formatToLabel: formatToLabelMap,
    }
  },

  makeYear4Digits(year) {
    if (year > 999) {
      return parseInt(year, 10)
    }

    if (year < 100) {
      return parseInt(year, 10) + 2000
    } else {
      return parseInt(year, 10) + 1900 // eg: 116, the standard output from (new Date()).getYear(), would become 2016
    }
  },
}

export default BulkMessageDateUtils
