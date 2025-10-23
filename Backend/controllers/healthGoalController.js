const HealthGoal = require('../models/HealthGoal');

// Create a new health goal
exports.createGoal = async (req, res) => {
    try {
        const { title, category, description, targetValue, unit, targetDate, frequency, reminders } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title and category are required' 
            });
        }
        
        const goal = new HealthGoal({
            patientId: req.user.id,
            title,
            category,
            description,
            targetValue,
            unit,
            targetDate,
            frequency,
            reminders
        });
        
        await goal.save();
        
        res.status(201).json({
            success: true,
            message: 'Health goal created successfully',
            goal
        });
    } catch (error) {
        console.error('Error creating health goal:', error);
        res.status(500).json({ success: false, message: 'Failed to create health goal' });
    }
};

// Get all goals for patient
exports.getGoals = async (req, res) => {
    try {
        const { status, category } = req.query;
        
        const filter = { patientId: req.user.id };
        if (status) filter.status = status;
        if (category) filter.category = category;
        
        const goals = await HealthGoal.find(filter).sort({ createdAt: -1 });
        
        // Calculate stats
        const stats = {
            total: goals.length,
            active: goals.filter(g => g.status === 'active').length,
            completed: goals.filter(g => g.status === 'completed').length,
            currentStreak: goals.reduce((max, g) => Math.max(max, g.streakCount), 0)
        };
        
        res.json({
            success: true,
            goals,
            stats
        });
    } catch (error) {
        console.error('Error fetching health goals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch health goals' });
    }
};

// Get single goal details
exports.getGoalById = async (req, res) => {
    try {
        const goal = await HealthGoal.findOne({
            _id: req.params.goalId,
            patientId: req.user.id
        });
        
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        
        res.json({ success: true, goal });
    } catch (error) {
        console.error('Error fetching goal:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch goal' });
    }
};

// Log progress for a goal
exports.logProgress = async (req, res) => {
    try {
        const { value, note } = req.body;
        const goal = await HealthGoal.findOne({
            _id: req.params.goalId,
            patientId: req.user.id
        });
        
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        
        // Add progress entry
        goal.progress.push({
            date: new Date(),
            value,
            note
        });
        
        // Update current value
        if (goal.frequency === 'daily') {
            goal.currentValue = value;
        } else {
            goal.currentValue = (goal.currentValue || 0) + (value || 0);
        }
        
        // Update streak
        const today = new Date().toDateString();
        const lastCheckin = goal.lastCheckin ? new Date(goal.lastCheckin).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastCheckin === yesterday || !lastCheckin) {
            goal.streakCount += 1;
            if (goal.streakCount > goal.longestStreak) {
                goal.longestStreak = goal.streakCount;
            }
        } else if (lastCheckin !== today) {
            goal.streakCount = 1;
        }
        
        goal.lastCheckin = new Date();
        goal.completedCount += 1;
        
        // Check if goal is completed
        if (goal.targetValue && goal.currentValue >= goal.targetValue) {
            goal.status = 'completed';
        }
        
        await goal.save();
        
        res.json({
            success: true,
            message: 'Progress logged successfully',
            goal,
            streakInfo: {
                currentStreak: goal.streakCount,
                longestStreak: goal.longestStreak
            }
        });
    } catch (error) {
        console.error('Error logging progress:', error);
        res.status(500).json({ success: false, message: 'Failed to log progress' });
    }
};

// Update goal
exports.updateGoal = async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['title', 'description', 'targetValue', 'unit', 'targetDate', 'frequency', 'reminders', 'status'];
        
        const goal = await HealthGoal.findOne({
            _id: req.params.goalId,
            patientId: req.user.id
        });
        
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                goal[key] = updates[key];
            }
        });
        
        await goal.save();
        
        res.json({
            success: true,
            message: 'Goal updated successfully',
            goal
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ success: false, message: 'Failed to update goal' });
    }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await HealthGoal.findOneAndDelete({
            _id: req.params.goalId,
            patientId: req.user.id
        });
        
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        
        res.json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ success: false, message: 'Failed to delete goal' });
    }
};

// Get goal suggestions based on health profile
exports.getGoalSuggestions = async (req, res) => {
    try {
        const suggestions = [
            {
                category: 'exercise',
                title: 'Daily Steps Goal',
                description: 'Walk 10,000 steps every day',
                targetValue: 10000,
                unit: 'steps',
                frequency: 'daily',
                icon: '🚶'
            },
            {
                category: 'nutrition',
                title: 'Drink More Water',
                description: 'Drink 8 glasses of water daily',
                targetValue: 8,
                unit: 'glasses',
                frequency: 'daily',
                icon: '💧'
            },
            {
                category: 'sleep',
                title: 'Better Sleep',
                description: 'Get 8 hours of sleep every night',
                targetValue: 8,
                unit: 'hours',
                frequency: 'daily',
                icon: '😴'
            },
            {
                category: 'mental_health',
                title: 'Daily Meditation',
                description: 'Meditate for 10 minutes daily',
                targetValue: 10,
                unit: 'minutes',
                frequency: 'daily',
                icon: '🧘'
            },
            {
                category: 'exercise',
                title: 'Weekly Workout',
                description: 'Exercise 3 times per week',
                targetValue: 3,
                unit: 'sessions',
                frequency: 'weekly',
                icon: '💪'
            },
            {
                category: 'weight',
                title: 'Weight Management',
                description: 'Track your weight weekly',
                targetValue: null,
                unit: 'kg',
                frequency: 'weekly',
                icon: '⚖️'
            },
            {
                category: 'habit',
                title: 'No Smoking',
                description: 'Stay smoke-free for 30 days',
                targetValue: 30,
                unit: 'days',
                frequency: 'daily',
                icon: '🚭'
            },
            {
                category: 'nutrition',
                title: 'Eat More Vegetables',
                description: '5 servings of vegetables daily',
                targetValue: 5,
                unit: 'servings',
                frequency: 'daily',
                icon: '🥗'
            }
        ];
        
        res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
    }
};

// Get goal analytics
exports.getGoalAnalytics = async (req, res) => {
    try {
        const goals = await HealthGoal.find({ 
            patientId: req.user.id 
        });
        
        // Calculate category distribution
        const categoryDistribution = {};
        goals.forEach(goal => {
            categoryDistribution[goal.category] = (categoryDistribution[goal.category] || 0) + 1;
        });
        
        // Calculate completion rates
        const completedGoals = goals.filter(g => g.status === 'completed').length;
        const activeGoals = goals.filter(g => g.status === 'active').length;
        
        // Get best streaks
        const bestStreak = goals.reduce((max, g) => Math.max(max, g.longestStreak), 0);
        const currentStreaks = goals.filter(g => g.status === 'active').map(g => ({
            title: g.title,
            streak: g.streakCount
        })).sort((a, b) => b.streak - a.streak).slice(0, 3);
        
        // Recent activity
        const recentProgress = goals
            .flatMap(g => g.progress.map(p => ({ 
                goalTitle: g.title, 
                ...p.toObject?.() || p 
            })))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        
        res.json({
            success: true,
            analytics: {
                totalGoals: goals.length,
                activeGoals,
                completedGoals,
                completionRate: goals.length > 0 
                    ? Math.round((completedGoals / goals.length) * 100) 
                    : 0,
                categoryDistribution,
                bestStreak,
                currentStreaks,
                recentProgress,
                totalCheckins: goals.reduce((sum, g) => sum + g.completedCount, 0)
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};
