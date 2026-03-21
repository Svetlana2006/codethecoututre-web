import { z } from "zod";

export function loadEnv(env: NodeJS.ProcessEnv) {
  const schema = z.object({
    PORT: z.coerce.number().default(3000),
    DATA_DIR: z.string().default("./data"),
  });
  return schema.parse(env);
}
