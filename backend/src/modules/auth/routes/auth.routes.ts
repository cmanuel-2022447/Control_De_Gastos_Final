import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { authenticateToken } from '../../../middleware/errorHandles';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/google-config', AuthController.googleConfig);
router.post('/google', AuthController.googleLogin);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/activity', authenticateToken, AuthController.activity);
router.get('/profile', authenticateToken, AuthController.profile);
router.put('/profile', authenticateToken, AuthController.updateProfile);

export default router;