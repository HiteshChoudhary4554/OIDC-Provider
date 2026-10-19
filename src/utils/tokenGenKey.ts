
import jwt from "jsonwebtoken";

import { PRIVATE_KEY, PUBLIC_KEY } from "../utils/cert.js";

export interface UserTokenPayload {
  id: string;
}

export function generateUserToken(payload: UserTokenPayload) {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "15m",
  });
}

export function verifyUserToken(token: string) {
  const payload = jwt.verify(token, PUBLIC_KEY, {
    algorithms: ["RS256"],
  });

  return payload as UserTokenPayload;
}
