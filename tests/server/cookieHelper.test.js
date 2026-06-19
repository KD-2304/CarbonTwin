const { parseCookies } = require('../../server/utils/cookieHelper');

describe('Cookie Helper - parseCookies', () => {
  it('should parse single cookie correctly', () => {
    const header = 'ctc_token=my_secret_token';
    const parsed = parseCookies(header);
    expect(parsed).toEqual({ ctc_token: 'my_secret_token' });
  });

  it('should parse multiple cookies correctly', () => {
    const header = 'ctc_token=my_secret_token; ctc_csrf_token=csrf_value; other_cookie=something';
    const parsed = parseCookies(header);
    expect(parsed).toEqual({
      ctc_token: 'my_secret_token',
      ctc_csrf_token: 'csrf_value',
      other_cookie: 'something'
    });
  });

  it('should handle URL-encoded values correctly', () => {
    const header = 'encoded_cookie=hello%20world%21';
    const parsed = parseCookies(header);
    expect(parsed).toEqual({ encoded_cookie: 'hello world!' });
  });

  it('should fallback to raw value if decodeURIComponent fails', () => {
    const header = 'malformed_cookie=%E0%A4%A';
    const parsed = parseCookies(header);
    expect(parsed).toEqual({ malformed_cookie: '%E0%A4%A' });
  });

  it('should return empty object for undefined/null/empty cookie header', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies('')).toEqual({});
    expect(parseCookies(12345)).toEqual({});
  });

  it('should handle whitespace variations', () => {
    const header = '  ctc_token  =  token_val  ;   second = val2';
    const parsed = parseCookies(header);
    expect(parsed).toEqual({
      ctc_token: 'token_val',
      second: 'val2'
    });
  });
});
