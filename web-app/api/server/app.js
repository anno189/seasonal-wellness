/**
 * This is a API server
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import solarTermRoutes from './routes/solarTerm.js';
import wellnessRoutes from './routes/wellness.js';
import recipeRoutes from './routes/recipe.js';
import teaRoutes from './routes/tea.js';
import constitutionRoutes from './routes/constitution.js';
import weatherRoutes from './routes/weather.js';
// for esm mode
const __dirname = import.meta.dirname;
// load env
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/solar-term', solarTermRoutes);
app.use('/api/wellness-plan', wellnessRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/tea', teaRoutes);
app.use('/api/constitution', constitutionRoutes);
app.use('/api/weather', weatherRoutes);
/**
 * health
 */
app.use('/api/health', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'ok',
    });
});
/**
 * error handler middleware
 */
app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Server internal error',
    });
});
/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API not found',
    });
});
export default app;
