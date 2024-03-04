import { getApp } from 'fe-lib-async-app';
import hootbus from 'utils/hootbus'
import { handleException, handleError } from '../utils/errors'

export const asyncStreamLoader = async (componentName, props) => {
    const app = await getApp('hs-app-streams-async');
    if (componentName) {
        if (app.isValidComponentName(componentName)) {
            app.mount(componentName, props)
                .catch(err => {
                    handleError(err);
                })
            const unmountErrorHandler = e => {
                const { error, ...additionalData } = e;
                handleException(error, additionalData);
                hootbus.off('streams.errors.UnmountError', unmountErrorHandler);
            }
            hootbus.on('streams.errors.UnmountError', unmountErrorHandler);
        } else {
            throw new Error(`Error while loading async Engage component "${componentName}": component doesn't exist`)
        }
    } else {
        throw new Error(`Error while loading async Engage component: component name not provided`)
    }
};
