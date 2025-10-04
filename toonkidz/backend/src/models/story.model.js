import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
    {
        theme: {
            type: String,
            required: true,
            enum: ["fairytale", "adventure", "animal", "science", "nature", "music"],
        },
        title: {
            type: String,
            required: true,
        },
        head: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        image: {   
            type: String,
            required: false,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        tags: {
            type: String,
            required: true,
        },
        favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    {
        timestamps: true,
    }
);

const Story = mongoose.model("Story", storySchema);

export default Story;