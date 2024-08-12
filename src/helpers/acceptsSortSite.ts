export default function (headers: Record<string, any>): boolean {
    const accept: string = headers.accept;
    if (!accept) {
        return false;
    }

    const acceptToArray = accept.split(',').map(a=>a.trim());
    return acceptToArray.indexOf('application/x-ms-application') !== -1 && acceptToArray.indexOf('application/x-ms-xbap') !== -1;
}