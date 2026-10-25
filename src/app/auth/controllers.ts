import type { Response, Request } from "express";
import { signupPayloadModel } from './models.js';
import db from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { hashToken, randomStringGenerate } from "../../utils/hashToken.js";


async function handleSignup(req : Request, res : Response) {
    const validateDataResult = await signupPayloadModel.safeParseAsync(req.body);

    if (validateDataResult.error) res.status(400).json({message : "body validation failed", error : validateDataResult.error.issues});

    const {firstName, lastName, email, password}  = validateDataResult.data!;

    const userEmailResult = await db.select().from(usersTable).where(eq(usersTable.email, email))

    if (userEmailResult.length > 0) return res.status(400).json({
        error : "duplicate entry",
        message : `user with email ${email} already exists`
    })

    const salt = await randomStringGenerate();
    const hash = await hashToken({ salt, token :  validateDataResult.data?.password! });

    const [result] = await db.insert(usersTable).values({
        firstName,
        lastName,
        email,
        password : hash,
        salt
    }).returning({ id : usersTable.id })

    return res.status(201).json({ message : "user has been created successfully", data : { id: result?.id } });
}

export {
    handleSignup,
}