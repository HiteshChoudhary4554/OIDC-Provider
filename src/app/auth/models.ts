import { z } from "zod";


export const signupPayloadModel = z.object({
    firstName : z.string().min(8).max(15),
    lastName : z.string().nullable().optional(),
    email: z.email(),
    password : z.string().min(6),
})

export const signinPayloadModel = z.object({
    email: z.email(),
    password : z.string().min(6),
})

export const developerAppPayloadModel = z.object({
    name : z.string().min(3).max(100),
    redirectUrl : z.string().url(),
});