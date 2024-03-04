import { LongtaskObserver } from 'fe-lib-longtask-observer';
import { getPerformanceMetrics } from 'fe-lib-performance-metrics';
import moment from 'moment-timezone';
import darklaunch from 'utils/darklaunch';

const PLAN_CREATE_NAMESPACE = 'plan_and_create';
const PLANNER_LOAD_METRIC_NAME = 'planner_load_seconds';
const PLANNER_MONTH_LOAD_METRIC_NAME = 'planner_month_load_seconds';
const PLANNER_LOAD_METRIC_DESCRIPTION = 'Time to load Planner';
const PLANNER_MONTH_LOAD_METRIC_DESCRIPTION = 'Time to load Planner Month View';
const PLANNER_LOAD_START_MARK = 'planner_load_started'
const PLANNER_LCP_MEASURE_NAME = 'planner_lcp_measure';
const PLANNER_LCP_METRIC_NAME = 'planner_custom_lcp';
const PLANNER_LCP_METRIC_DESCRIPTION = 'Planner Largest Contentful Paint';
const PLANNER_LOAD_ATTEMPT = 'planner_load_attempt';
const PLANNER_LOAD_ATTEMPT_METRIC_DESCRIPTION = 'Planner load attempt';
const PLANNER_LOAD_FAILED = 'planner_load_failed';
const PLANNER_LOAD_FAILED_METRIC_DESCRIPTION = 'Planner load failed';
export const PLANNER_INITIAL_RENDER_TIME_START_MARK = 'planner_initial_render_time_start_mark'
const BUCKET_SIZES = [
  0.05, 0.1, 0.25, 0.5, 1, 2.5, 4, 5, 7, 10, 20, 30, 45, 60,
];
const PERFORMANCE_ENTRY_TYPES = {
  ELEMENT: 'element',
  MEASURE: 'measure',
  MARK: 'mark'
}

const PLANNER_VIEWS = {
  LIST: 'planner_list_view',
  WEEK: 'planner_week_view',
  MONTH: 'planner_month_view'
}

const OPERATING_SYSTEMS = {
  MAC_OS: 'Mac OS',
  WINDOWS: 'Windows',
  OTHERS: 'Others'
}

function getLastUsedCalendarView() {
  return window.localStorage &&
    window.localStorage.getItem(
        hs.memberId + '.pnc_preferences_last_used_calendar_view'
    );
}

function isWeekView() {
  const lastUsedCalendarView = getLastUsedCalendarView();
  return !lastUsedCalendarView ||
    lastUsedCalendarView === 'WEEK_EXPANDED' ||
    lastUsedCalendarView === 'WEEK_CONDENSED' ||
    lastUsedCalendarView === 'WEEK';
}

function isMonthView() {
  const lastUsedCalendarView = getLastUsedCalendarView();
  return lastUsedCalendarView === 'MONTH_COUNT_BY_POST_TYPE' ||
    lastUsedCalendarView === 'MONTH_COUNT_BY_SN' ||
    lastUsedCalendarView === 'MONTH';
}

function getViewLabel() {
  if (isWeekView()) {
    return PLANNER_VIEWS.WEEK;
  } else if (isMonthView()) {
    return PLANNER_VIEWS.MONTH;
  } else {
    return PLANNER_VIEWS.LIST;
  }
}

export function measureTTL() {
  if (isWeekView()) {
    getPerformanceMetrics(PLAN_CREATE_NAMESPACE)
      .getHistogramTimer(
        PLANNER_LOAD_METRIC_NAME,
        PLANNER_LOAD_METRIC_DESCRIPTION,
        BUCKET_SIZES
      ).start();
  } else if (isMonthView()) {
    getPerformanceMetrics(PLAN_CREATE_NAMESPACE)
      .getHistogramTimer(
        PLANNER_MONTH_LOAD_METRIC_NAME,
        PLANNER_MONTH_LOAD_METRIC_DESCRIPTION,
        BUCKET_SIZES
      ).start();
  }
}

export function recordLoadAttempt() {
  const view = getLastUsedCalendarView()
  let isFullLoad = false
  let isPageRefresh = false
  if (darklaunch.isFeatureEnabledOrBeta('PUB_31587_MEASURE_PLANNER_REFRESH_METRIC')) {
    isFullLoad = !window.hs?.prevDashboardUrl
    if (isFullLoad && performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload') {
      isPageRefresh = true
    }
  }
  getPerformanceMetrics(PLAN_CREATE_NAMESPACE)
    .getCounter(PLANNER_LOAD_ATTEMPT, PLANNER_LOAD_ATTEMPT_METRIC_DESCRIPTION)
    .inc({
      ...(darklaunch.isFeatureEnabledOrBeta('PUB_31587_MEASURE_PLANNER_REFRESH_METRIC')
        ? { isFullLoad: isFullLoad.toString(), isPageRefresh: isPageRefresh.toString() }
        : {}),
      planType: window.hs?.memberMaxPlanCode,
      ...(view && { view }),
    });
}

export function recordLoadFailed() {
  const view = getLastUsedCalendarView()
  getPerformanceMetrics(PLAN_CREATE_NAMESPACE)
    .getCounter(PLANNER_LOAD_FAILED, PLANNER_LOAD_FAILED_METRIC_DESCRIPTION)
    .inc({
      planType: window.hs?.memberMaxPlanCode,
      ...(view && { view }),
    });
}

export function getUtcOffsetLabel(timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const offsetInMinutes = moment.tz(timezone).utcOffset();
  const offsetInHours = offsetInMinutes / 60;
  return offsetInHours.toString();
}

// mac_os, windows, others
function getOperatingSystemLabel() {
  const os = navigator.userAgent;
  let label = '';
  if (os.indexOf(OPERATING_SYSTEMS.WINDOWS) > -1){
    label = OPERATING_SYSTEMS.WINDOWS;
  } else if (os.indexOf(OPERATING_SYSTEMS.MAC_OS) > -1){
    label = OPERATING_SYSTEMS.MAC_OS;
  } else {
    label = OPERATING_SYSTEMS.OTHERS;
  }
  return label.toLowerCase().replace(' ', '_'); // labels use underscore
}

// slow_2g, 2g, 3g, 4g
// https://wicg.github.io/netinfo/#effective-connection-types
function getConnectionLabel() {
  return (
    navigator &&
    navigator.connection &&
    navigator.connection.effectiveType
  ).toLowerCase().replace('-', '_'); // labels use underscore;
}

export class LCP {
  constructor() {
    this.elementIdentifiers = {};
    this.elementTimingMarks = new Set();
  }

  setElementIdentifiers(identifiers) {
    this.elementIdentifiers = identifiers;
  }

  /**
   * Planner Largest Contentful Paint (LCP) custom metric is a custom metric that reports the render time of the
   * largest most important element within Planner viewport during the loading and rendering process of the web pages.
   * 
   * Measurement process:
   * 1. Use Element Timing API to observe the render timings of a bunch of largest most important elements;
   * 2. Use User Timing API to mark the render timing of an element to browser's performance timeline;
   * 3. After Planner finishes loading, determine the largest most important element we care about and measure its render time duration;
   * 4. Record the duration to Prometheus in seconds.
   * 
   * The reason why we observe a bunch of elements is that users could land Planner in different views and each view has a different largest most important element.
   * Only one element will be selected to measure LCP metric after Planner is loaded.
   * 
   * The largest most important element for Planner is selected in below order:
   * Media thumbnail with background image, if exists in the DOM; or
   * Card message text node, if exists in the DOM; or
   * Month view day of month status text node, if exists in the DOM; or
   * Month view day of month count by social network text node, if exists in the DOM; or
   * Toolbar date range picker text node, when there is no cards or data in the calendar.
   */
  observe() {
    performance.mark(PLANNER_LOAD_START_MARK);
  
    const performanceObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === PERFORMANCE_ENTRY_TYPES.ELEMENT) {
          const elementEntry = entry.toJSON();
          const elementTimingMark = elementEntry.identifier;

          // Mark the first element entry per identifier to browser's performance timeline.
          // Use these performance marks to measure the duration of rendering Planner's largest most important element.
          if (!this.elementTimingMarks.has(elementTimingMark)) {
            this.elementTimingMarks.add(elementTimingMark);
            performance.mark(elementTimingMark);
          }
        } else if (
          entry.entryType === PERFORMANCE_ENTRY_TYPES.MEASURE &&
          entry.name === PLANNER_LCP_MEASURE_NAME
        ) {
          // Send LCP custom metric measurement to Prometheus
          this.record(entry);

          // Clean up
          performanceObserver.disconnect();
          this.clearMarks();
        } 
      }
    });
    performanceObserver.observe({
      entryTypes:
        Object.values(PERFORMANCE_ENTRY_TYPES).filter(type => type !== PERFORMANCE_ENTRY_TYPES.MARK)
    });
  
    const longtaskObserver = new LongtaskObserver();
    longtaskObserver.getTimeToInteractive().then(() => {
      // When Planner finishes loading, start LCP measurement
      this.measure();
    });
  }

  measure() {
    const {
      NEW_CARD_MEDIA_THUMBNAIL,
      MEDIA_THUMBNAIL,
      NEW_CARD_MESSAGE_TEXT,
      CARD_MESSAGE_TEXT,
      DAY_OF_MONTH_STATUS_TEXT,
      DAY_OF_MONTH_COUNT_BY_SN_TEXT,
      TOOLBAR_DATE_RANGE_TEXT,
    } = this.elementIdentifiers;
    let PLANNER_LCP_MEASURE_MARK = '';

    // Find out the largest most important element and measure its render time
    if (this.elementTimingMarks.has(NEW_CARD_MEDIA_THUMBNAIL)) {
      PLANNER_LCP_MEASURE_MARK = NEW_CARD_MEDIA_THUMBNAIL;
    } else if (this.elementTimingMarks.has(MEDIA_THUMBNAIL)) {
      PLANNER_LCP_MEASURE_MARK = MEDIA_THUMBNAIL;
    } else if (this.elementTimingMarks.has(NEW_CARD_MESSAGE_TEXT)) {
      PLANNER_LCP_MEASURE_MARK = NEW_CARD_MESSAGE_TEXT;
    } else if (this.elementTimingMarks.has(CARD_MESSAGE_TEXT)) {
      PLANNER_LCP_MEASURE_MARK = CARD_MESSAGE_TEXT;
    } else if (this.elementTimingMarks.has(DAY_OF_MONTH_STATUS_TEXT)) {
      PLANNER_LCP_MEASURE_MARK = DAY_OF_MONTH_STATUS_TEXT;
    } else if (this.elementTimingMarks.has(DAY_OF_MONTH_COUNT_BY_SN_TEXT)) {
      PLANNER_LCP_MEASURE_MARK = DAY_OF_MONTH_COUNT_BY_SN_TEXT;
    } else if (this.elementTimingMarks.has(TOOLBAR_DATE_RANGE_TEXT)) {
      PLANNER_LCP_MEASURE_MARK = TOOLBAR_DATE_RANGE_TEXT;
    }

    const lcpMarks = performance.getEntriesByName(
      PLANNER_LCP_MEASURE_MARK,
      PERFORMANCE_ENTRY_TYPES.MARK
    );
    if (lcpMarks.length > 0) {
      performance.measure(PLANNER_LCP_MEASURE_NAME, {
        detail: { identifier: PLANNER_LCP_MEASURE_MARK },
        start: PLANNER_LOAD_START_MARK,
        end: PLANNER_LCP_MEASURE_MARK
      });
    }
  }

  record(measureEntry) {
    const durationInSeconds = (measureEntry.duration / 1000).toFixed(2);
    getPerformanceMetrics(PLAN_CREATE_NAMESPACE)
      .getHistogram(
        PLANNER_LCP_METRIC_NAME,
        PLANNER_LCP_METRIC_DESCRIPTION,
        BUCKET_SIZES
      )
      .observe(
        durationInSeconds,
        {
          identifier: measureEntry.detail.identifier,
          view: getViewLabel(),
          os: getOperatingSystemLabel(),
          connection: getConnectionLabel(),
          'utc_offset': getUtcOffsetLabel()
        }
      );
  }

  clearMarks() {
    performance.clearMarks(PLANNER_LOAD_START_MARK);
    this.elementTimingMarks.forEach(elementTimingMark => {
      performance.clearMarks(elementTimingMark);
    });
  }
}
