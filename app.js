import express from 'express';
import 'dotenv/config'
import router from './src/routes/files.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.get('/health', (req, res) => {
    return res.json({
        status: 200,
        message: "App is healthy"
    });
});
app.use('/media', express.static(path.join(__dirname, 'storage', 'output')));
app.use("/api", router);

// Serve the React production build when it exists. Vite handles this in development.
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.get('*splat', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/media')) return next();
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'), (error) => {
        if (error) next();
    });
});

app.use((err, req, res, next) => {
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        errors: err.errors || []
    });
});
export default app;
