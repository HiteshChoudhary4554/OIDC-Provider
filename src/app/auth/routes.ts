import express from 'express';
import type { Router } from 'express';
import * as controller from './controllers.js';

const router : Router = express.Router();

router.post('/register', controller.handleSignup);

export default router;