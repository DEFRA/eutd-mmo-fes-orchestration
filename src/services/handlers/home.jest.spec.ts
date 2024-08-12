import HomeHandler from './home';

describe('home handler', () => {
  it ('returns errors and next', async () => {
    // Arrange
    const url = '/';
    const handler = HomeHandler[url];
    const data = {
      journeySelection: 'abc'
    };

    // Act
    const { errors, next } = await handler({
      data: data,
      _nextUrl: '',
      _currentUrl: url,
      errors: {}
    });

    // Assert
    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
    expect(next).toEqual('abc');
  });
});
