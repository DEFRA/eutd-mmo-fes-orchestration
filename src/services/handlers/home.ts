export default {

  "/": async ({ data, _nextUrl, _currentUrl, errors }) => {
    return { errors, next: data.journeySelection }
  }
}
