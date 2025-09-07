import { processScheduledReminders } from "../controllers/ReminderController";

export const processRemindersCron = async (): Promise<void> => {
    try {
        console.log(`[${new Date().toISOString()}] Processing scheduled reminders...`);
        await processScheduledReminders();
        console.log(`[${new Date().toISOString()}] Reminder processing completed`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing reminders:`, error);
    }
};

export const startReminderProcessingDev = (): void => {
    setInterval(processRemindersCron, 5 * 60 * 1000);
   
    // Also process immediately on startup
    processRemindersCron();
   
    console.log("Development reminder processing service started (every 5 minutes)");
};

// For production, you can use this function to process reminders on demand
export const processRemindersOnDemand = async (): Promise<{ success: boolean; message: string; processedCount?: number }> => {
    try {
        const startTime = Date.now();
        await processScheduledReminders();
        const endTime = Date.now();
        
        return {
            success: true,
            message: `Reminders processed successfully in ${endTime - startTime}ms`,
        };
    } catch (error) {
        console.error("Error processing reminders on demand:", error);
        return {
            success: false,
            message: `Failed to process reminders: ${error}`,
        };
    }
};

// Example cron job commands for production:
// 
// Add to crontab (crontab -e):
// # Process reminders every minute
// * * * * * curl -X POST http://localhost:5000/api/cron/process-reminders
// 
// # Or process reminders every 5 minutes
// */5 * * * * curl -X POST http://localhost:5000/api/cron/process-reminders
// 
// # Or use a more sophisticated approach with node-cron package:
// npm install node-cron
// 
// Then in your server.ts:
// import cron from 'node-cron';
// 
// // Schedule reminder processing every minute
// cron.schedule('* * * * *', () => {
//     processRemindersCron();
// });
