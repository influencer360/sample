import { createServer, Model } from "miragejs"

type UserModelType ={name:string} ;

export function makeServer({ environment = "test" } = {}) {
  let server = createServer({
    environment,

    models: {
      socialUsers:Model.extend<Partial<UserModelType>>({}),
    },

    seeds(server) {
    //   server.create("user", { name: "Bob" })
    //   server.create("user", { name: "Alice" })
    },

    routes() {
      this.namespace = "api";
      this.timing = 2000;
      this.get("/socialUsers", (schema) => {
        return schema.all('socialUsers')
      })
    },
  })

  return server
}