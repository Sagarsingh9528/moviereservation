import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import db from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import seatRoutes from "./routes/seatRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

db.connect()
  .then((client) => {
    console.log('PostgreSQL connected successfully');
    client.release();
  })
  .catch((error) => {
    console.error('PostgreSQL connection failed:', error.message);
  });

app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movies', movieRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);


app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});


app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  res.status(500).json({
    message: 'Internal server error',
  });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});