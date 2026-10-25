import express from 'express';
import type {Express, Request, Response} from 'express';
import authRouter from './auth/routes.js';
import oidcRouter from './oidc.routes.js';
import cors from 'cors';


export function createServerApplication():Express {
    const app = express();
    app.use(express.json());
    app.use(cors());
    
    //#region OIDC Routes
    app.use('/', oidcRouter);
    //#endregion


    //#region register Routes
    app.use("/auth", authRouter);
    app.use("/o/", authRouter);
    //#endregion

    //#region * Routes
    app.all("{*path}", (req: Request, res: Response) => {
        res.status(404).json({
            message : "your path is invalid.."
        })
    })
    //#endregion

    return app;
}