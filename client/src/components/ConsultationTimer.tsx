import { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

interface ConsultationTimerProps {
    startTime: string;
    onTimeUp?: () => void;
}

const ConsultationTimer = ({ startTime, onTimeUp }: ConsultationTimerProps) => {
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(true);

    useEffect(() => {
        const calculateRemainingTime = () => {
            const start = new Date(startTime);
            const now = new Date();
            const elapsed = now.getTime() - start.getTime();
            const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds
            const remaining = threeMinutes - elapsed;
            
            return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds for more precision
        };

        const updateTimer = () => {
            const remaining = calculateRemainingTime();
            setRemainingTime(remaining);
            
            if (remaining === 0 && isActive) {
                setIsActive(false);
                onTimeUp?.();
            }
        };

        // Update immediately
        updateTimer();

        // Update every second for more accurate countdown
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime, isActive, onTimeUp]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (remainingTime <= 30) return "text-red-600"; // Last 30 seconds
        if (remainingTime <= 60) return "text-yellow-600"; // Last minute
        return "text-green-600";
    };

    if (!isActive) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
                <FiClock className="w-4 h-4" />
                <span className="text-sm font-medium">Consultation Completed</span>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
            <FiClock className="w-4 h-4" />
            <span className="text-sm font-medium">
                Time remaining: <span className={getTimerColor()}>{formatTime(remainingTime)}</span>
            </span>
        </div>
    );
};

export default ConsultationTimer;
