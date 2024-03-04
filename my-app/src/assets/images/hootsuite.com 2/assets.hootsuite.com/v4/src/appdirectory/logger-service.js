const logAjaxEventDelay = 1000;
const maxPacketSize = 50;

let eventQueue = [];
let timer = null;

const sendEvents = function() {
  const data = {
    eventQueue: eventQueue,
    csrfToken: hs.csrfToken
  };

  fetch("/ajax/appdirectory/log-ajax-event", {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify(data),
    "method": "POST",
  });
  
  eventQueue = [];
};

const logAjaxEvent = function(payload) {
  if (eventQueue.length < maxPacketSize) {
    eventQueue.push(payload);
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(sendEvents, logAjaxEventDelay);
  } else {
    eventQueue.push(payload);
    clearTimeout(timer);
    sendEvents();
  }
};

const loggerService = {
  logAjaxEvent: logAjaxEvent
};

export default loggerService;
