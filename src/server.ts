import cors from "cors";
import express from "express";
import { config } from "~/config";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (_, res) => {
	return res.status(200).json({ message: "Server is up and running!!" });
});

app.post("/strings", () => {
	//   {
	//   "id": "sha256_hash_value",
	//   "value": "string to analyze",
	//   "properties": {
	//     "length": 17,
	//     "is_palindrome": false,
	//     "unique_characters": 12,
	//     "word_count": 3,
	//     "sha256_hash": "abc123...",
	//     "character_frequency_map": {
	//       "s": 2,
	//       "t": 3,
	//       "r": 2,
	//       // ... etc
	//     }
	//   },
	//   "created_at": "2025-08-27T10:00:00Z"
	// }
});

app.get("/strings", () => {
	//   query parameters
	//   is_palindrome: boolean (true/false)
	// min_length: integer (minimum string length)
	// max_length: integer (maximum string length)
	// word_count: integer (exact word count)
	// contains_character: string (single character to search for)
	//   {
	//   "data": [
	//     {
	//       "id": "hash1",
	//       "value": "string1",
	//       "properties": { /* ... */ },
	//       "created_at": "2025-08-27T10:00:00Z"
	//     },
	//     // ... more strings
	//   ],
	//   "count": 15,
	//   "filters_applied": {
	//     "is_palindrome": true,
	//     "min_length": 5,
	//     "max_length": 20,
	//     "word_count": 2,
	//     "contains_character": "a"
	//   }
	// }
});

app.get("/strings/:id", () => {
	//   {
	//   "id": "sha256_hash_value",
	//   "value": "requested string",
	//   "properties": { /* same as above */ },
	//   "created_at": "2025-08-27T10:00:00Z"
	// }
});

app.delete("/strings/:id", () => {
	// return 204 - no content
});

app.get("/strings/filter-by-natural-language", () => {
	//   query parameters
	//   "all single word palindromic strings" → word_count=1, is_palindrome=true
	// "strings longer than 10 characters" → min_length=11
	// "palindromic strings that contain the first vowel" → is_palindrome=true, contains_character=a (or similar heuristic)
	// "strings containing the letter z" → contains_character=z
	// {
	//   "data": [ /* array of matching strings */ ],
	//   "count": 3,
	//   "interpreted_query": {
	//     "original": "all single word palindromic strings",
	//     "parsed_filters": {
	//       "word_count": 1,
	//       "is_palindrome": true
	//     }
	//   }
	// }
});

app.listen(config.port, () => {
	console.log(`Server is running on port ${config.port}`);
});
