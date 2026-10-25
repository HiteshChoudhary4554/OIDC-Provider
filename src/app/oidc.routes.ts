import express from 'express';
import type { Router } from 'express';
import jose from "node-jose";
import { PUBLIC_KEY } from "../utils/cert.js";
import path from 'node:path';
import { developerAppPayloadModel } from './auth/models.js';
import db from "../db/index.js";
import { appsTable, usersTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { signinPayloadModel } from './auth/models.js';
import { generateUserToken, verifyUserToken } from '../utils/tokenGenKey.js';
import { hashToken, randomStringGenerate } from '../utils/hashToken.js';



const router : Router = express.Router();
const PORT = process.env.PORT;

//#region developer console

router.get('/o/developer-console', (req, res) => {
    return res.sendFile(path.resolve("public", "developerConsole.html"));
})

router.get('/o/developer-key',(req, res) => {
    return res.sendFile(path.resolve("public", "developerConsoleKey.html"));
})

router.post('/o/submit-developer-form', async (req, res) => {
    const validateData = await developerAppPayloadModel.safeParseAsync(req.body);
    if (validateData.error) {
        return res.status(403).json({
            message : "field are allowed.."
        })
    }
    const clientId = await randomStringGenerate();
    const clientSecret = await randomStringGenerate();
    
const developerConsoleUser = await db
  .insert(appsTable)
  .values({
    name: validateData.data.name,
    clientId, 
    clientSecret,
    redirectUrl: validateData.data.redirectUrl,
  })
  .returning();

    
    if (!developerConsoleUser.length) res.status(500).json({
        message : "something went wrogn while create developer console...",
    })

    return res.status(200).json({
        message : "success",
        data : {
            id : developerConsoleUser[0]?.id,
            clientId ,
            clientSecret
        }
    })

})
//#endregion

//#region configuration discovery
router.get('/.well-known/openid-configuration', (req, res) => {
    const ISSUER = `http://localhost:${PORT}`;
    return res.status(200).json(
        {
            "ISSUER": ISSUER,
            "authorization_endpoint": `${ISSUER}/o/signin/{clientId}`,
            "token_endpoint": `${ISSUER}/o/token/{shortCode}/{secretId}`,
            "userinfo_endpoint": `${ISSUER}/o/userinfo/{token}`, 
            "jwks_uri": `${ISSUER}/.well-known/jwks.json`,
            "developer-console":`${ISSUER}/o/developer-console`,
        })
});
//#endregion

//#region public key
router.get('/.well-known/jwks.json',async (req, res) => {
  const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
  return res.json({ keys: [key.toJSON()] });
});
//#endregion

//#region authenticate screen
router.get('/o/signin/:clientId', async (req, res) => {
    const clientId = req.params.clientId;

    const isClient = await db.select().from(appsTable).where(eq(appsTable.clientId,clientId));
    
    const client = isClient[0];
        if (!client) return res.status(403).json({
            message : "Client Id is missing"
    })

    const url = `/o/authenticate-page/${encodeURIComponent(
    client.name
)}/${encodeURIComponent(client.redirectUrl)}`;
    return res.redirect(url);
})


router.get('/o/authenticate-page/:name/:redirectUrl', async (req, res) => {
    return res.sendFile(path.resolve("public", "authenticate.html"));
})

router.post('/o/user-authenticate', async (req, res) => {
    const validateData = await signinPayloadModel.safeParseAsync(req.body);
    if (validateData.error) {
        return res.status(403).json({
            message : "field are allowed.."
        })
    }

    
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email,validateData.data.email));

    if(!user) res.status(403).json({
            message : "Invalid email and password"
    })

    const salt = user!.salt!;
    const hash = await hashToken({salt, token: validateData.data.password})

    if (user?.password !== hash) res.status(403).json({
            message : "Invalid email and password"
    })

    const shortCode = await randomStringGenerate();
    const hashShortCode = await hashToken({salt :process.env.SALT!, token :  shortCode });
     
    //@ts-ignore
    user.shortCode = hashShortCode ;

    //@ts-ignore
    await user?.save();    

    return res.status(200).json({
        message : "Success",
        data : {
            shortCode,
        }})
})

//#endregion

//#region token generate
router.get('/o/token/:shortCode/:secret_id',async (req, res) => {
    const secret_id = req.params.secret_id;
    const shortCode = req.params.shortCode;

    if (!shortCode || !secret_id) return res.status(400).json({
        error : "short code && secret_id missing..",
        message : `missing....`
    })

    const isSecretId = await db.select().from(appsTable).where(eq(appsTable.clientSecret,secret_id));

    if (!isSecretId.length) return res.status(400).json({
        error : "Invalid short code or secret id",
        message : `missing....`
    })

    if(isSecretId[0]?.clientSecret !== secret_id) return res.status(400).json({
        error : "Invalid secret id or short code",
        message : `missing....`
    })


    const hashShortCode = await hashToken({salt :process.env.SALT!, token :  shortCode });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.shortCode,hashShortCode));


    if (!user) return res.status(400).json({
        error : "Invalid short code or secret id",
        message : `missing....`
    })

    const token = generateUserToken({ id : user.id! });

    return res.status(200).json({
        message : "Success",
        data : {    
         token
        }
    });

});
//#endregion

//#region user info
router.get('/o/userinfo/:token', async (req, res) => {
    const token = req.params.token;

    if(!token) return res.status(400).json({
        error : "token is missing",
        message : `missing....` 
    });

    const isToken = verifyUserToken(token);

    if(!isToken) return res.status(403).json({
        error : "Invalid token",
        message : `missing....` 
    });

    const [userData] = await db.select().from(usersTable).where(eq(usersTable.id,isToken.id));

    if(!userData) return res.status(403).json({
        error : "invalid token in db",
        message : `missing....` 
    });



    return res.status(200).json({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
    });
});
//#endregion

export default router;