import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();


export const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

// For production use TLS
// export const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT,
//   username: process.env.REDIS_USERNAME,
//   password: process.env.REDIS_PASSWORD,
//   tls: {} 
// });

try {
  redis.on('connect', () => {
    console.log('Connected to Redis');
  });
  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });
} catch (error) {
  console.log("error : ",error);
}
