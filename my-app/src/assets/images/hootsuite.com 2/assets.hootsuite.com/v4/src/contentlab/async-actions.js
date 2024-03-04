import { getApp } from "fe-lib-async-app";

const APP_NAME = "hs-app-contentlab";

export const createTemplate = function ({data, callback}) {
  getApp(APP_NAME).then(async (app) => {
    const response = await app?.createTemplate(data)
    callback(response)
  });
}

export const editTemplate = function(data) {
    return getApp(APP_NAME).then(async (app) => {
        return await app?.editTemplate(data)
    });
}
