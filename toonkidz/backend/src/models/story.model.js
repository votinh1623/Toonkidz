//story.model.js
import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
    min: 1
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  },
  audio: {
    type: String,
    required: false
  },
  //  imagePrompt: {  // ADD THIS FIELD
  //   type: String,
  //   required: false
  // }
});

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
      required: false,
    },
    pages: [pageSchema],
    coverImage: {
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
      enum: ["draft", "generating", "generated", "preview", "published"],
      default: "draft"
    },
    tags: [{
      type: String,
      required: false,
    }],
    readingTime: {
      type: Number,
      required: false
    },
    ageGroup: {
      type: String,
      enum: ["3-5", "6-8", "9-12"],
      required: false
    },
    language: {
      type: String,
      default: "en"
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0,
    },
    ratedBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, required: true }
    }],
  },
  {
    timestamps: true,
  }
);

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ theme: 1, status: 1 });
storySchema.index({ tags: 1 });

const Story = mongoose.model("Story", storySchema);

export default Story;