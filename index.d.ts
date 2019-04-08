import { Server as HttpServer, IncomingMessage, ServerResponse } from 'http'
import { Server as HttpsServer } from 'https'
import {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse
} from 'http2'

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

  type Request<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2ServerRequest
    : IncomingMessage

  interface ResponseExtensions {
    send(
      data?: unknown,
      code?: number,
      headers?: Record<string, number | string | string[]>,
      cb?: () => void
    ): void
  }

  type Response<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2ServerResponse & ResponseExtensions
    : ServerResponse & ResponseExtensions

  type Server<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2SecureServer
    : P extends Protocol.HTTPS
    ? HttpsServer
    : HttpServer

  interface Router {}

  interface Options<P extends Protocol> {
    server?: Server<P>
    routerFactory?(options: Options<P>): Router
    prioRequestsProcessing?: boolean
    ignoreTrailingSlash?: boolean
    allowUnsafeRegex?: boolean
    maxParamLength?: number
    defaultRoute?(req: Request<P>, res: Response<P>): void
    disableResponseEvent?: boolean
  }

  interface Service<P extends Protocol> {}
}

declare function restana<P extends restana.Protocol = restana.Protocol.HTTP>(
  options?: restana.Options<P>
): restana.Service<P>

export = restana
