import mongoose from "mongoose";

type StringInterface = {
	value: string;
	raw_value: string;
	length: number;
	raw_length: number;
	is_palindrome: boolean;
	unique_characters_num: number;
	word_count: number;
	created_at: Date;
	updated_at: Date | null;
	character_frequency: { character: string; count: number }[];
};

const characterFrequencyMapSchema = new mongoose.Schema({
	character: { type: String, required: true },
	count: { type: Number, required: true },
});

const stringSchema = new mongoose.Schema<StringInterface>({
	value: { type: String, required: true, unique: true },
	raw_value: { type: String, required: true },
	length: { type: Number, required: true },
	raw_length: { type: Number, required: true },
	is_palindrome: { type: Boolean, required: true },
	unique_characters_num: { type: Number, required: true },
	word_count: { type: Number, required: true },
	character_frequency: {
		type: [characterFrequencyMapSchema],
		required: true,
		_id: false,
	},
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: null },
});

export const StringModel = mongoose.model("Strings", stringSchema);
