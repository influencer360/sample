/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createEvent } from 'ics';
import { createRoot } from 'react-dom/client';

const backupIcs = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:adamgibbons/ics
METHOD:PUBLISH
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:GDHyF0Ay8PDZ5V_o_eoOK
SUMMARY:🏆 Schedule your posts in Hootsuite
DTSTAMP:20220407T090000
DTSTART:20220411T093000
DESCRIPTION:Here's your friendly reminder to schedule all of your posts for
	 the week ahead! Save time managing social media, and rest assured your p
	osts will be published whether you're at your desk or on the go.\n\nHead t
	o https://hootsuite.com/dashboard#/planner to get started.
URL:https://hootsuite.com/dashboard#/planner
STATUS:CONFIRMED
X-MICROSOFT-CDO-BUSYSTATUS:BUSY
RRULE:FREQ=WEEKLY;BYDAY=MO;INTERVAL=1
DURATION:PT30M
END:VEVENT
END:VCALENDAR`;

export const createGoogleCalendarLink = () => {
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((7 - nextMonday.getDay()) % 7) + 1);
  const year = nextMonday.getFullYear();
  // Google calendar's URL format expects a 2 digit month and date, so pad to fill.
  const month = (nextMonday.getMonth() + 1).toString().padStart(2, '0');
  const date = nextMonday.getDate().toString().padStart(2, '0');
  // The lack of 'Z' at the end of these formatted dates means it is local time, so timezones are handled.
  const formattedStartDate = `${year}${month}${date}T090000`;
  const formattedEndDate = `${year}${month}${date}T093000`;

  // The lack of indentations here is important, it keeps the string as a single unspaced URL string.
  const link = `https://calendar.google.com/calendar/u/0/r/eventedit
?text=🏆+Schedule+your+posts+in+Hootsuite
&dates=${formattedStartDate}/${formattedEndDate}
&details=Here's your friendly reminder to schedule all of your posts for the week ahead! Save time managing social media, and rest assured your posts will be published whether you're at your desk or on the go.%0A%0AHead to https://hootsuite.com/dashboard%23/planner to get started.
&recur=RRULE:FREQ=WEEKLY;BYDAY=Mo
&sf=true
&output=xml
  `;

  return link;
};

export const createIcs = () => {
  // The following code finds the next monday in the future, and uses that month / day in the creation of the .ics file.
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((7 - nextMonday.getDay()) % 7) + 1);
  // Note the +1. Date object months are zero indexed, ics library months are not, hence the +1.
  const month = nextMonday.getMonth() + 1;
  const day = nextMonday.getDate();

  const { error, value } = createEvent({
    start: [2022, month, day, 9, 0],
    // These two lines ensure that the start time set above is interpreted as local time, removing the need to handle timezones.
    startInputType: 'local',
    startOutputType: 'local',
    duration: { minutes: 30 },
    title: '🏆 Schedule your posts in Hootsuite',
    description:
      "Here's your friendly reminder to schedule all of your posts for the week ahead! Save time managing social media, and rest assured your posts will be published whether you're at your desk or on the go.\n\nHead to https://hootsuite.com/dashboard#/planner to get started.",
    url: 'https://hootsuite.com/dashboard#/planner',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;INTERVAL=1',
  });

  if (error) {
    //TODO: Add tracking event for error logging.
    const data = new File([backupIcs], 'hootsuite.ics', { type: 'text/calendar' });
    return window.URL.createObjectURL(data);
  } else if (value) {
    const data = new File([value], 'hootsuite.ics', { type: 'text/calendar' });
    return window.URL.createObjectURL(data);
  }
};

const appendModal = () => {
  const modalDiv = document.createElement('DIV');
  modalDiv.classList.add('onboarding-modal-div');
  modalDiv.setAttribute(
    'style',
    `
    position: absolute;
    float: left;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  `,
  );
  document.getElementById('container')?.appendChild(modalDiv);
  return modalDiv;
};

const appendModalCenter = () => {
  const modalDiv = document.createElement('DIV');
  modalDiv.classList.add('onboarding-modal-div');
  modalDiv.setAttribute(
    'style',
    `
    position: absolute;
    float: left;
    left: 50%;
    top: 50%;
  `,
  );
  document.getElementById('container')?.appendChild(modalDiv);
  return modalDiv;
};

export function showModal(Modal: any, props: any) {
  createRoot(appendModal()).render(React.createElement(Modal, props));
}

export function showModalInCenter(Modal: any, props: any) {
  createRoot(appendModalCenter()).render(React.createElement(Modal, props));
}
