/** API Errors */
class APIError extends Error {
  constructor(reason, api, endpoint) {
    super(`Couldn't fetch ${endpoint} from ${api}: ${reason}.`);
  }
}

/** Basic API Handler */
class API {
  static ROOTS = {
    modrinth: "https://api.modrinth.com/v2",
    modpacker: `${window.location.origin}/api/v1`,
  };
  static EXPIRES = 3 * 60 * 1000;

  name;
  cache = {};

  constructor(name) {
    this.name = name;
  }

  getError(reason, endpoint) {
    return new APIError(reason, this.name, endpoint);
  }

  get(endpoint) {
    return new Promise((resolve, reject) => {
      if (API.ROOTS[this.name] == null)
        reject(this.getError("Invalid API", endpoint));

      if (
        this.cache[endpoint] != null &&
        this.cache[endpoint].expires.getTime() > new Date().getTime()
      ) {
        resolve(this.cache[endpoint].data);
      } else {
        fetch(`${API.ROOTS[this.name]}${endpoint}`, {
          method: "GET",
        })
          .then((res) => res.json())
          .then((json) => {
            this.cache[endpoint] = {
              expires: new Date(new Date().getTime() + API.EXPIRES),
              data: json,
            };
            resolve(json);
          })
          .catch(reject);
      }
    });
  }

  post(endpoint, body) {
    return new Promise((resolve, reject) => {
      if (API.ROOTS[this.name] == null)
        reject(this.getError("Invalid API", endpoint));

      fetch(`${API.ROOTS[this.name]}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((res) => res.json())
        .then((json) => {
          resolve(json);
        })
        .catch(reject);
    });
  }
}

// ACTUAL APIS

/** Modpacker API */
class ModpackerAPI extends API {
  constructor() {
    super("modpacker");
  }
}
const MODPACKER_API = new ModpackerAPI();

/** Modrinth API */
class ModrinthAPI extends API {
  constructor() {
    super("modrinth");
  }

  project(id) {
    return this.get(`/project/${id}`);
  }
}
const MODRINTH_API = new ModrinthAPI();
