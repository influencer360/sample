// This should be the only js line that defines hs.boot, but it can be already present in the page source
hs.boot = hs.boot || {} // if `hs` is not present just crash. What did load this?

const noop = () => {}

const onDOMReady = (fn) => {
    // Is DOM already rendered?
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', () => fn());
    }
}

export const setupBoot = (bootFunctions) => {
    Object.assign(hs.boot, bootFunctions)
}

/**
 * Run a "boot" function
 *
 * A page can define what function to call on boot by setting\
 * the data-boot attribute on the <body> tag.
 *
 * Such function must be defined as a property of `hs.boot`.
 *
 * e.g.
 *
 * <html>
 * <script>
 * // code in layout to setup `hs` global object
 * const hs = {
 *   boot: {}
 * }
 * </script>
 *
 * <script>
 * // code from some bundle
 * hs.boot["usuallyBundleName"] = () => { console.log('called once on boot') }
 * </script>
 *
 * <body data-boot="usuallyBundleName">
 * </body>
 * </html>
 */
export const boot = () => onDOMReady(() => {
    // backend usually set data-boot through template var jsBoot
    const initClass = document.getElementsByTagName('body')[0]?.dataset.boot || ''

    if (hs && typeof hs.boot?.[initClass] === 'function') {
        hs.boot[initClass]();
        // the boot function should only be called once by section type
        hs.boot[initClass] = noop
    }
});
