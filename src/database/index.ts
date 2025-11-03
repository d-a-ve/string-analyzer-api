import mongoose from "mongoose";
import { config } from "~/config";
import { InternalServerError } from "~/errors";

export async function connectToDB() {
	if (!config.database.url) {
		throw new InternalServerError(
			"MONGODB_URI is not defined in environment variables."
		);
	}

	await mongoose.connect(config.database.url);
}

export async function disconnectDB() {
	if (mongoose.connection.readyState === 1) await mongoose.disconnect();
}
