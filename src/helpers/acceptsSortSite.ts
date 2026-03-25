export default function acceptsSortSite(headers: Record<string, any>): boolean {
    const accept: string = headers.accept;
    if (!accept) {
        return false;
    }

    const acceptToArray = accept.split(',').map(a=>a.trim());
    return acceptToArray.includes('application/x-ms-application') && acceptToArray.includes('application/x-ms-xbap');
}