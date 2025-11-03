process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

import cors from "cors";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { config } from "~/config";
import { connectToDB, disconnectDB } from "~/database";
import { StringModel } from "~/database/models";
import {
	BadRequestError,
	BaseError,
	DataConflictError,
	NotFoundError,
	RouteNotFoundError,
	UnprocessableEntityError,
} from "~/errors";

(async () => {
	await connectToDB();
})();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (_, res) => {
	return res.status(200).json({ message: "Server is up and running!!" });
});

app.post("/strings", async (req: Request, res: Response) => {
	const data = req.body;

	if (!data.value) {
		console.log("Missing 'value' field in request body:", data);
		throw new BadRequestError('"value" field is required in the request body.');
	}
	const value = String(data.value).trim().toLowerCase();
	const sanitizedValue = value.replace(/[^a-zA-Z]/g, "");

	const existingString = await StringModel.findOne({ value: sanitizedValue });

	if (existingString) {
		console.log(`String "${sanitizedValue}" already exists in the system.`);
		throw new DataConflictError(
			`String "${sanitizedValue}" already exists in the system.`
		);
	}

	const sha256HashedValue = crypto.hash("sha256", value);
	const wordsCount = value.split(" ").length;
	const reversedValue = sanitizedValue.split("").reverse().join("");
	const isPalindrome = sanitizedValue === reversedValue;

	const characterFrequencyMap: Record<string, number> = {};

	for (const char of sanitizedValue) {
		if (characterFrequencyMap[char]) {
			characterFrequencyMap[char] += 1;
		} else {
			characterFrequencyMap[char] = 1;
		}
	}

	const characterFrequencyArray = Object.entries(characterFrequencyMap).map(
		([key, value]) => ({
			character: key,
			count: value,
		})
	);

	const newString = new StringModel({
		value: sanitizedValue,
		raw_value: value,
		length: sanitizedValue.length,
		raw_length: value.length,
		is_palindrome: isPalindrome,
		unique_characters_num: characterFrequencyArray.length,
		word_count: wordsCount,
		character_frequency: characterFrequencyArray,
	});
	await newString.save();
	console.log(newString);

	return res.status(201).json({
		id: sha256HashedValue,
		value: newString.raw_value,
		properties: {
			length: newString.length,
			is_palindrome: newString.is_palindrome,
			unique_characters: newString.unique_characters_num,
			word_count: newString.word_count,
			sha256_hash: sha256HashedValue,
			character_frequency_map: characterFrequencyMap,
		},
		created_at: newString.created_at.toISOString(),
	});
});

app.get("/strings/filter-by-natural-language", async (req, res) => {
	const { query } = req.query;

	if (!query) {
		console.log('Missing "query" parameter in request.');
		throw new BadRequestError('"query" parameter is required.');
	}

	const sanitizedQuery = String(query)
		.toLowerCase()
		.trim()
	const filters = {
		"all single word palindromic strings": {
			interpretation: { word_count: 1, is_palindrome: true },
			command: { word_count: 1, is_palindrome: true },
		},
		"strings longer than 10 characters": {
			interpretation: { min_length: 11 },
			command: { word_count: {$gte: 10} },
		},
		"palindromic strings that contain the first vowel": {
			interpretation: { is_palindrome: true, contains_character: "a" },
			command: {
				is_palindrome: true,
				character_frequency: { $elemMatch: { character: "a" } },
			},
		},
		"strings containing the letter z": {
			interpretation: { contains_character: "z" },
			command: { character_frequency: { $elemMatch: { character: "z" } } },
		},
	};
	const filter = filters[sanitizedQuery as keyof typeof filters];

	if (!filter) {
		console.log("Unable to process the query:", sanitizedQuery);
		throw new UnprocessableEntityError(
			`Unable to process the query: "${query}".`
		);
	}

	const stringEntries = await StringModel.find(filter.command);
	return res.status(200).json({
		data: stringEntries.map((entry) => {
			const sha256HashedValue = crypto.hash("sha256", entry.value);
			return {
				id: sha256HashedValue,
				value: entry.raw_value,
				properties: {
					length: entry.value.length,
					is_palindrome: entry.is_palindrome,
					unique_characters: entry.unique_characters_num,
					word_count: entry.word_count,
					sha256_hash: sha256HashedValue,
					character_frequency_map: entry.character_frequency,
				},
				created_at: entry.created_at.toISOString(),
			};
		}),
		count: stringEntries.length,
		interpreted_query: {
			original: sanitizedQuery,
			parsed_filters: filter.interpretation,
		},
	});
});

app.get("/strings/:id", async (req, res) => {
	const value = req.params.id.toLowerCase();
	const sanitizedValue = value.replace(/[^a-zA-Z]/g, "");

	const stringEntry = await StringModel.findOne({ value: sanitizedValue });

	if (!stringEntry) {
		throw new NotFoundError(`String ${value} does not exist in the system.`);
	}

	const sha256HashedValue = crypto.hash("sha256", value);

	return res.status(200).json({
		id: sha256HashedValue,
		value: stringEntry.raw_value,
		properties: {
			length: stringEntry.value.length,
			is_palindrome: stringEntry.is_palindrome,
			unique_characters: stringEntry.unique_characters_num,
			word_count: stringEntry.word_count,
			sha256_hash: sha256HashedValue,
			character_frequency_map: stringEntry.character_frequency,
		},
		created_at: stringEntry.created_at.toISOString(),
	});
});

app.get("/strings", async (req, res) => {
	const {
		contains_character,
		is_palindrome,
		min_length,
		max_length,
		word_count,
	} = req.query;

	const stringEntries = await StringModel.find({
		...(is_palindrome && { is_palindrome: is_palindrome === "true" }),
		...(word_count && { word_count: Number(word_count) }),
		...((min_length || max_length) && {
			length: {
				...(min_length && { $gte: Number(min_length) }),
				...(max_length && { $lte: Number(max_length) }),
			},
		}),
		...(contains_character && {
			character_frequency: {
				$elemMatch: { character: contains_character },
			},
		}),
	});

	return res.status(200).json({
		data: stringEntries.map((entry) => {
			const sha256HashedValue = crypto.hash("sha256", entry.value);
			return {
				id: sha256HashedValue,
				value: entry.raw_value,
				properties: {
					length: entry.value.length,
					is_palindrome: entry.is_palindrome,
					unique_characters: entry.unique_characters_num,
					word_count: entry.word_count,
					sha256_hash: sha256HashedValue,
					character_frequency_map: entry.character_frequency,
				},
				created_at: entry.created_at.toISOString(),
			};
		}),
		count: stringEntries.length,
		filter_applied: {
			...(is_palindrome && is_palindrome === "true" && { is_palindrome: true }),
			...(word_count && { word_count: Number(word_count) }),
			...(min_length && { min_length: Number(min_length) }),
			...(max_length && { max_length: Number(max_length) }),
			...(contains_character && {
				contains_character,
			}),
		},
	});
});

app.delete("/strings/:id", async (req, res) => {
	const value = req.params.id.toLowerCase();
	const sanitizedValue = value.replace(/[^a-zA-Z]/g, "");

	const deletedString = await StringModel.findOneAndDelete({
		value: sanitizedValue,
	});

	if (!deletedString) {
		console.log("String not found for deletion:", sanitizedValue);
		throw new NotFoundError(`String ${value} does not exist in the system.`);
	}

	return res.status(204).json();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((req: Request, _: Response) => {
	throw new RouteNotFoundError(req.url, req.method);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
	console.log(err)
	if (err instanceof BaseError) {
		return res.status(err.statusCode).json({ error: err.message });
	}

	return res.status(500).json({
		error: "Something unexpected went wrong, please try again later!",
	});
});

const server = http.createServer(app);

server.listen(config.port, () => {
	console.log(`Server is running on port ${config.port}`);
});

async function gracefulShutdown() {
	server.close(() => console.log("HTTP server closed"));
	await disconnectDB();
}

async function handleUncaughtException(err: unknown) {
	console.error("Uncaught Exception:", err);
	await gracefulShutdown();
	process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUnhandledRejection(reason: any) {
	console.error("Unhandled Rejection:", reason);
	if (process.env.NODE_ENV === "production") {
		await gracefulShutdown();
		process.exit(1);
	}
}

async function handleShutdown() {
	console.log("Received shutdown signal");
	await gracefulShutdown();
	process.exit(0);
}
