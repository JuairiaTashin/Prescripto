import { processScheduledReminders } from "../controllers/ReminderController";

export const processReminders = async (): Promise<void> => {
    try {
        console.log("Processing scheduled reminders...");
        await processScheduledReminders();
        console.log("Reminder processing completed");
    } catch (error) {
        console.error("Error processing reminders:", error);
    }
};


export const startReminderProcessing = (): void => {
    // Process reminders every 5 minutes
    setInterval(processReminders, 5 * 60 * 1000);
   
    // Also process immediately on startup
    processReminders();
   
    console.log("Reminder processing service started");
};







