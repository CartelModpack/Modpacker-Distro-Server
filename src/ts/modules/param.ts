// Imports
import { URLSearchParams } from "url";

// Exports

/**
 * Process the value of a variable and convert it to the correct primative.
 * @param data The input data from the paramater
 * @returns The data converted into the correct primative.
 */
export function getPrimative(data: string): unknown {
  if (
    ["true", "false", "t", "f"].includes(data.toLowerCase()) ||
    data.length === 0
  ) {
    return data.toLowerCase().slice(0, 1) === "t" || data.length === 0;
  } else if (String(Number(data)) != "NaN") {
    return Number(data);
  } else {
    try {
      return JSON.parse(data);
    } catch (_error) {
      return data;
    }
  }
}

/**
 * Process url paramaters.
 * @param params The input paramater string.
 * @returns A map that contains all the paramaters and their values.
 */
export function processParamaters(params: string): Map<string, unknown> {
  let outmap = new Map<string, unknown>();
  let loaded = new URLSearchParams(params);
  for (let key of loaded.keys()) {
    outmap.set(key, getPrimative(loaded.get(key)));
  }
  return outmap;
}

export default processParamaters;
