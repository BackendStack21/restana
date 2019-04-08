declare namespace restana {
  enum Protocol {
    HTTP = 'http',
    HTTPS = 'https',
    HTTP2 = 'http2'
  }

  enum Method {
    GET = 'get',
    DELETE = 'delete',
    PATCH = 'patch',
    POST = 'post',
    PUT = 'put',
    HEAD = 'head',
    OPTIONS = 'options',
    TRACE = 'trace'
  }
}
