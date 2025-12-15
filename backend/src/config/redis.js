const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-14269.c241.us-east-1-4.ec2.cloud.redislabs.com',
        port: 14269
    }
});

module.exports = redisClient;