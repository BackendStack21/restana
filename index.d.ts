import {
  Server as HttpServer,
  IncomingMessage,
  ServerResponse
} from 'http'
import { Server as HttpsServer } from 'https'
import { ListenOptions } from 'net'
import {
  Http2Server,
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse
} from 'http2'
import { EventEmitter } from 'events'

declare namespace restana {
  enum Protocol {
    HTTP = 'http',
    HTTPS = 'https',
    HTTP2 = 'http2'
  }

  // https://github.com/microsoft/TypeScript/issues/1897#issuecomment-580962081
  type Body =
  | null
  | boolean
  | number
  | string
  | Buffer
  | Body[]
  | { [prop: string]: Body }

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
    query: Record<string, string | string[]>
    originalUrl: string,
    body?: Body
  }

  type Request<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2ServerRequest & RequestExtensions
    : IncomingMessage & RequestExtensions

  interface ResponseExtensions {
    send(
      data?: unknown,
      code?: number,
      headers?: Record<string, number | string | string[]>,
      cb?: (error?: Error) => void
    ): void | Promise<void>
  }

  interface Router<P extends Protocol> {
    readonly id: string
    get: RegisterRoute<P, this>
    delete: RegisterRoute<P, this>
    patch: RegisterRoute<P, this>
    post: RegisterRoute<P, this>
    put: RegisterRoute<P, this>
    head: RegisterRoute<P, this>
    options: RegisterRoute<P, this>
    all: RegisterRoute<P, this>
    use(...middlewares: RequestHandler<P>[]): this
    use(prefix: string, ...middlewares: RequestHandler<P>[]): this
    use(prefix: string, router: Router<P>): this
    lookup(req: Request<P>, res: Response<P>): unknown
    find(method: string, path: string): unknown
  }

  interface TraceRouter<P extends Protocol> extends Router<P> {
    trace: RegisterRoute<P, this>
  }

  type Response<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2ServerResponse & ResponseExtensions
    : ServerResponse & ResponseExtensions

  type Server<P extends Protocol> = P extends Protocol.HTTP2
    ? Http2Server | Http2SecureServer
    : P extends Protocol.HTTPS
    ? HttpsServer
    : HttpServer

  type RequestHandler<P extends Protocol> = (
    req: Request<P>,
    res: Response<P>,
    next: (error?: unknown) => void
  ) => void | Promise<unknown>

  type RequestListener<P extends Protocol> = (
    req: P extends Protocol.HTTP2 ? Http2ServerRequest : IncomingMessage,
    res: P extends Protocol.HTTP2 ? Http2ServerResponse : ServerResponse
  ) => void

  interface HttpError extends Error {
    status?: number
    statusCode?: number
    code?: number | string
    data?: unknown
  }

  type ErrorHandler<P extends Protocol> = (
    err: HttpError,
    req: Request<P>,
    res: Response<P>,
  ) => void | Promise<unknown>

  interface RegisterRoute<P extends Protocol, R = Service<P>> {
    (
      path: string | string[],
      ...middlewares: RequestHandler<P>[]
    ): R
  }

  type RouterType = 'trie' | 'sequential'

  interface Options<P extends Protocol> {
    server?: Server<P>
    prioRequestsProcessing?: boolean
    router?: RouterType
    caseSensitive?: boolean
    ignoreTrailingSlash?: boolean
    routerCacheSize?: number
    defaultRoute?: RequestHandler<P>
    errorHandler?: ErrorHandler<P>
    securityHeaders?: boolean
    enableTrace?: boolean
    trustProxy?: boolean
    debugErrors?: boolean
  }

  interface TraceOptions<P extends Protocol> extends Options<P> {
    enableTrace: true
  }

  interface ServiceEvents extends EventEmitter {
    readonly BEFORE_ROUTE_REGISTER: 'beforeRouteRegister'
  }

  interface Service<P extends Protocol> extends Router<P> {
    readonly events: ServiceEvents
    routes(): string[],
    getRouter(): Router<P>,
    newRouter(): Router<P>
    readonly errorHandler: ErrorHandler<P>,
    getServer(): Server<P>,
    getConfigOptions(): Readonly<Options<P>>
    handle(req: Request<P>, res: Response<P>): void
    callback(): RequestListener<P>
    start(port?: number, host?: string): Promise<Server<P>>
    start(options: ListenOptions): Promise<Server<P>>
    start(path: string): Promise<Server<P>>
    close(): Promise<void>
  }

  interface TraceService<P extends Protocol> extends Service<P> {
    trace: RegisterRoute<P, this>
    getRouter(): TraceRouter<P>
    newRouter(): TraceRouter<P>
  }
}

declare function restana<P extends restana.Protocol = restana.Protocol.HTTP>(
  options: restana.TraceOptions<P>
): restana.TraceService<P>

declare function restana<P extends restana.Protocol = restana.Protocol.HTTP>(
  options?: restana.Options<P>
): restana.Service<P>

export = restana
