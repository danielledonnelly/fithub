const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['strength', 'cardio', 'hiit', 'yoga', 'other']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  exercises: [{
    name: {
      type: String,
      required: true
    },
    sets: [{
      reps: Number,
      weight: Number, // in kg
      duration: Number // in seconds, for planks etc.
    }]
  }],
  metrics: {
    heartRate: {
      average: Number,
      max: Number
    },
    distance: Number, // in kilometers
    pace: Number // average minutes per kilometer
  }
}, {
  timestamps: true
});

// Add indexes for common queries
workoutSchema.index({ date: -1 });
workoutSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema); 