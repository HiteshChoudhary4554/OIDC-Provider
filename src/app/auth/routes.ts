import express from 'express';
import type { Router } from 'express';
import path from 'node:path';
import * as controller from './controllers.js';

const router : Router = express.Router();

router.get('/register', (_req, res) => {
    return res.sendFile(path.resolve("public", "register.html"));
});
router.post('/register', controller.handleSignup);

export default router;