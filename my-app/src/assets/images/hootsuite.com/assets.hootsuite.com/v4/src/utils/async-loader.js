window.asyncLoaderCache = {}

export default function asyncLoader(uri) {
    if (window.asyncLoaderCache[uri]) {
        return window.asyncLoaderCache[uri]
    } else {
        const p = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = uri;
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script);
        })

        window.asyncLoaderCache[uri] = p
        return p
    }
}

