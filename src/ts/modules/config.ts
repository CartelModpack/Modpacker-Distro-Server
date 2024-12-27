import dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

type RuntimeEnvironments = "development" | "production" | "test";
let runtimeEnv: RuntimeEnvironments =
  process.env.NODE_ENV != null
    ? <RuntimeEnvironments>process.env.NODE_ENV
    : "development";

console.info(`Starting program in "${runtimeEnv}" environment`);

export interface Config {
  node_env: RuntimeEnvironments;
  port: number;
}

export const config: Config = {
  node_env: runtimeEnv,
  port:
    process.env.PORT != null
      ? Number(process.env.PORT)
      : runtimeEnv === "production"
      ? 80
      : 8080,
};

export default config;
