const Workout = require('../models/Workout');

// Get all workouts for a user
exports.getWorkouts = async (req, res) => {
  try {
    const { userId } = req.user; // Will be set by auth middleware
    const { type, startDate, endDate } = req.query;

    let query = { userId };
    
    // Add filters if provided
    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .limit(50);

    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get workout by ID
exports.getWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new workout
exports.createWorkout = async (req, res) => {
  try {
    const workout = new Workout({
      ...req.body,
      userId: req.user.userId
    });

    await workout.save();
    res.status(201).json(workout);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update workout
exports.updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete workout
exports.deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get workout statistics
exports.getStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    const stats = await Workout.aggregate([
      { 
        $match: { 
          userId,
          ...(Object.keys(dateQuery).length && { date: dateQuery })
        }
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$calories' },
          avgDuration: { $avg: '$duration' },
          workoutsByType: {
            $push: {
              type: '$type',
              duration: '$duration',
              calories: '$calories'
            }
          }
        }
      }
    ]);

    if (!stats.length) {
      return res.json({
        totalWorkouts: 0,
        totalDuration: 0,
        totalCalories: 0,
        avgDuration: 0,
        workoutsByType: []
      });
    }

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 