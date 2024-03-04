'use strict';

export default {
    // this header propagated though all backend calls, so backend services know which product requests came from
    PRODUCT_HEADER_KEY: 'baggage-product',
    PRODUCT_HEADER_STREAMS: 'streams',
    // this header propagated though all backend calls, so backend services know which UI requests came from
    PLATFORM_HEADER_KEY: 'baggage-platform',
    PLATFORM_HEADER_WEB: 'web',
};
