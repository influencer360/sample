import { IUserInfoDropdown } from "@/utils/commonTypes";
import { createServer, Model } from "miragejs"

export function makeServer({ environment = "test" } = {}) {
  let server = createServer({
    environment,

    models: {
      socialUser:Model.extend<Partial<IUserInfoDropdown>>({}),
    },

    seeds(server) {
    //   server.create("user", { name: "Bob" })
    //   server.create("user", { name: "Alice" })
    },

    routes() {
      this.namespace = "api";
      this.timing = 2000;
      this.get("/socialUsers", (schema) => {
        return schema.all('socialUser')
      })
      this.post("/socialUser", (schema, request) => {
        let attrs = JSON.parse(request.requestBody);
       return schema.create("socialUser", attrs);
      })
    },
  })

  return server
}