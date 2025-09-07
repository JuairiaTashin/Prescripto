import mongoose from "mongoose";
import User, { IUser } from "../models/User";
import Rating from "../models/Rating";

// Update doctor's rating statistics
export const updateDoctorRatingStats = async (doctorId: string): Promise<void> => {
    try {
        // Get rating statistics for the doctor
        const stats = await Rating.aggregate([
            { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                    ratingDistribution: {
                        $push: "$rating"
                    }
                }
            }
        ]);

        let ratingStats = {
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };

        if (stats.length > 0) {
            const result = stats[0];
            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            
            result.ratingDistribution.forEach((rating: number) => {
                distribution[rating as keyof typeof distribution]++;
            });

            ratingStats = {
                averageRating: Math.round(result.averageRating * 10) / 10,
                totalRatings: result.totalRatings,
                ratingDistribution: distribution
            };
        }

        // Update doctor's rating statistics
        await User.findByIdAndUpdate(doctorId, {
            ratingStats
        });

        console.log(`Updated rating stats for doctor ${doctorId}:`, ratingStats);
    } catch (error) {
        console.error("Error updating doctor rating stats:", error);
    }
};

// Update rating statistics for all doctors (useful for migration)
export const updateAllDoctorRatingStats = async (): Promise<void> => {
    try {
        const doctors = await User.find({ role: "doctor" });
        
        for (const doctor of doctors) {
            await updateDoctorRatingStats((doctor._id as mongoose.Types.ObjectId).toString());
        }
        
        console.log("Updated rating stats for all doctors");
    } catch (error) {
        console.error("Error updating all doctor rating stats:", error);
    }
};