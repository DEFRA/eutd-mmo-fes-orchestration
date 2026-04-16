export default function acceptsHtml(headers: Record<string, any>): boolean {
  const accept: string = headers.accept;
  if (!accept) {
    return false;
  }
  return accept.split(',').includes('text/html');
}