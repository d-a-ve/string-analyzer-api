if (process.env.NODE_ENV !== "production") {
	process.loadEnvFile('./.env.local')
}

const database = Object.freeze({
	url: process.env.MONGODB_URI,
});

export const config = {
	port: process.env.PORT || 8080,
	database,
};
