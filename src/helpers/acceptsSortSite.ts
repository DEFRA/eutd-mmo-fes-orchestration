export default function acceptsSortSite (headers: Record<string, any>): boolean {
    const accept: string = headers.accept;
    if (!accept) {
        return false;
    }

    const acceptToArray = new Set(accept.split(',').map(a=>a.trim()));
    return acceptToArray.has('application/x-ms-application') && acceptToArray.has('application/x-ms-xbap');
}