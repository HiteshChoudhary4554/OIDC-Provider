import { createHmac, randomBytes } from "node:crypto";

interface payload {
    token : string,
    salt : string
}

export async function hashToken(data : payload) {
        return await createHmac('sha256',data.salt).update(data.token).digest("hex");   
}

export async function randomStringGenerate() {
    return await randomBytes(8).toString("hex").slice(0, 10);
}