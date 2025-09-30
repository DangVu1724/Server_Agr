const express = require('express');
const cors = require('cors');

require('./config/dotenv');

const recommendationRoutes = require('./routes/recommendation');
const nearbyRoutes = require('./routes/nearby');
const notificationRoutes = require('./routes/notification');
const orderRoutes = require('./routes/order');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/recommendations', recommendationRoutes);
app.use('/nearby', nearbyRoutes);
app.use('/notification', notificationRoutes);
app.use('/order', orderRoutes);


// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Server listening on ${port}`));
