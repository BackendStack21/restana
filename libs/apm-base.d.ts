declare namespace apm {
  interface Agent {
    setTransactionName(name: string): void
  }

  interface Options {
    apm?: Agent
    agent?: Agent
  }

  interface RoutesNaming {
    /**
     * Patches the route registration methods of a service or router so each
     * request transaction is named after its route pattern, e.g. `GET /users/:id`.
     * Must be called before registering routes.
     */
    patch(app: object): void
  }
}

declare function apm(options: apm.Options): apm.RoutesNaming

export = apm
