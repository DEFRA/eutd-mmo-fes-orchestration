export default function(headers: Record<string, any>): boolean {
  const accept: string = headers.accept;
  if (!accept) {
    return false;
  }
  return accept.split(',').indexOf('text/html') !== -1;
}