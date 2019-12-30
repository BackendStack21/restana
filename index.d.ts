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

  interface RequestExtensions {
    params: Record<string, string>
    originalUrl: string
  }

  type Request<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2ServerRequest & RequestExtensions
    : IncomingMessage & RequestExtensions

  interface ResponseExtensions {
    send(
      data?: unknown,
      code?: number,
      headers?: Record<string, number | string | string[]>,
      cb?: () => void
    ): void
  }

  interface Router <P extends Protocol> {
    get: RegisterRoute<P>
    delete: RegisterRoute<P>
    patch: RegisterRoute<P>
    post: RegisterRoute<P>
    put: RegisterRoute<P>
    head: RegisterRoute<P>
    options: RegisterRoute<P>
    trace: RegisterRoute<P>
    all: RegisterRoute<P>
  }

  type Response<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2ServerResponse & ResponseExtensions
    : ServerResponse & ResponseExtensions

  type Server<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2SecureServer
    : P extends Protocol.HTTPS
    ? HttpsServer
    : HttpServer

  type RequestHandler<P extends Protocol> = (
    req: Request<P>,
    res: Response<P>,
    next: (error?: unknown) => void
  ) => void | Promise<unknown>

  type ErrorHandler<P extends Protocol> = (
    err: Error,
    req: Request<P>,
    res: Response<P>,
  ) => void | Promise<unknown>

  interface RegisterRoute<P extends Protocol> {
    (
      path: string,
      handler: RequestHandler<P>,
      middlewares?: RequestHandler<P>[]
    ): Service<P>

    (
      path: string,
      handler: RequestHandler<P>,
      middlewares?: RequestHandler<P>[]
    ): Service<P>

    (
      path: string,
      middleware1: RequestHandler<P>,
      handler: RequestHandler<P>,
    ): Service<P>

    (
      path: string,
      middleware1: RequestHandler<P>,
      middleware2: RequestHandler<P>,
      handler: RequestHandler<P>,
    ): Service<P>

    (
      path: string,
      middleware1: RequestHandler<P>,
      middleware2: RequestHandler<P>,
      middleware3: RequestHandler<P>,
      handler: RequestHandler<P>,
    ): Service<P>
  }

  interface Route<P extends Protocol> {
    method: Method
    path: string
    handler: RequestHandler<P>
    middlewares: RequestHandler<P>[]
  }

  interface Options<P extends Protocol> {
    server?: Server<P>
    prioRequestsProcessing?: boolean
    routerCacheSize?: number
    defaultRoute?: RequestHandler<P>
    errorHandler?: ErrorHandler<P>
  }

  interface Service<P extends Protocol> extends Router<P> {
    getRouter(): Router<P>,
    newRouter(): Router<P>
    errorHandler: ErrorHandler<P>,
    getServer(): Server<P>,
    getConfigOptions(): Options<P>
    use(middleware: RequestHandler<P>): restana.Service<P>
    use(prefix: string, middleware: RequestHandler<P>): restana.Service<P>
    handle(req: Request<P>, res: Response<P>): void
    start(port?: number, host?: string): Promise<Server<P>>
    close(): Promise<void>
  }
}

declare function restana<P extends restana.Protocol = restana.Protocol.HTTP>(
  options?: restana.Options<P>
): restana.Service<P>

export = restana
