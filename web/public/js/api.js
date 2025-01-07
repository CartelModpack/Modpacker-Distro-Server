/** An API Error. */
class APIError extends Error {
  /**
   * @param {string} reason The reason for the error.
   * @param {string} api The API it was thrown from.
   * @param {string} endpoint The endpoint requested.
   */
  constructor(reason, api, endpoint) {
    super(`Couldn't fetch ${endpoint} from ${api}: ${reason}.`);
  }
}

/** Basic API */
class API {
  /** The API roots that are known. */
  static ROOTS = {
    modrinth: "https://api.modrinth.com/v2",
    modpacker: `${window.location.origin}/api/v1`,
  };

  /** The cache expiry time in milliseconds. */
  static EXPIRES = 3 * 60 * 1000;

  /** The name for {@link API.ROOTS} that the API uses. @type {string} */
  name;

  /** The cache that the API uses. @type {Map<string,{expires: Date, body: string, data: object}>} */
  cache = new Map();

  /**
   * @param {string} name The name for {@link API.ROOTS} that the API uses.
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Generate an error to throw.
   * @param {string} reason The reason for the error.
   * @param {string} endpoint The endpoint requested.
   * @returns An {@link APIError} instance.
   */
  getError(reason, endpoint) {
    return new APIError(reason, this.name, endpoint);
  }

  /**
   * Make a GET request to the API.
   * @param {string} endpoint The endpoint to request to.
   * @returns {Promise<object>} A promise that resolves into the API response, or rejects if an error occurs.
   */
  get(endpoint) {
    return new Promise((resolve, reject) => {
      // Check if the API is known.
      if (API.ROOTS[this.name] == null)
        reject(this.getError("Invalid API", endpoint));

      // Check if the cache has a value.
      if (
        this.cache.get(endpoint) != null &&
        this.cache.get(endpoint).expires.getTime() > new Date().getTime()
      ) {
        // Resolve cached value.
        resolve(this.cache.get(endpoint).data);
      } else {
        fetch(`${API.ROOTS[this.name]}${endpoint}`, {
          method: "GET",
        })
          .then((res) => res.json())
          .then((json) => {
            // Load into cache.
            this.cache.set(endpoint, {
              expires: new Date(new Date().getTime() + API.EXPIRES),
              body: null,
              data: json,
            });

            // Resolve.
            resolve(json);
          })
          .catch(reject);
      }
    });
  }

  /**
   * Make a POST request to the API.
   * @param {string} endpoint The endpoint to request to.
   * @param {object} body The POST request body.
   * @returns {Promise<object>} A promise that resolves into the API response, or rejects if an error occurs.
   */
  post(endpoint, body) {
    return new Promise((resolve, reject) => {
      // Check if the API is known.
      if (API.ROOTS[this.name] == null)
        reject(this.getError("Invalid API", endpoint));

      // Check if the cache has a value.
      if (
        this.cache.get(endpoint) != null &&
        this.cache.get(endpoint).body === body &&
        this.cache.get(endpoint).expires.getTime() > new Date().getTime()
      ) {
        // Resolve cached value.
        resolve(this.cache.get(endpoint).data);
      } else {
        fetch(`${API.ROOTS[this.name]}${endpoint}`, {
          method: "POST",
          body: JSON.stringify(body),
        })
          .then((res) => res.json())
          .then((json) => {
            // Load into cache.
            this.cache.set(endpoint, {
              expires: new Date(new Date().getTime() + API.EXPIRES),
              body,
              data: json,
            });

            // Resolve.
            resolve(json);
          })
          .catch(reject);
      }
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

  /**
   * Get a project from Modrinth.
   * @param {string} id The Modrinth project id.
   * @returns A promise that contains the project info. (See {@link API.get})
   */
  project(id) {
    return this.get(`/project/${id}`);
  }
}
const MODRINTH_API = new ModrinthAPI();
