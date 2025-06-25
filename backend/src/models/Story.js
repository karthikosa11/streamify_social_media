import mongoose from "mongoose";

const storyItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [storyItemSchema],
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        // Stories expire after 24 hours
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      },
    },
  },
  { timestamps: true }
);

// Automatically remove expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);

export default Story; 