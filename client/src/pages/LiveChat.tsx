import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { livechatAPI, appointmentAPI } from "../services/api";
import { toast } from "react-hot-toast";
import ConsultationTimer from "../components/ConsultationTimer";
import {
    FiMessageSquare,
    FiSend,
    FiArrowLeft,
    FiUser,
    FiCalendar,
    FiClock,
    FiFileText,
    FiX,
    FiVideo,
    FiMic,
} from "react-icons/fi";

interface Message {
    _id: string;
    sender: {
        _id: string;
        name: string;
        role: string;
    };
    content: string;
    timestamp: string;
    isRead: boolean;
}

interface ChatRoom {
    _id: string;
    appointment: {
        _id: string;
        appointmentDate: string;
        appointmentTime: string;
        reason: string;
        status: string;
        consultationStatus: string;
        consultationStartTime?: string;
        consultationEndTime?: string;
    };
    patient: {
        _id: string;
        name: string;
    };
    doctor: {
        _id: string;
        name: string;
        specialty: string;
    };
    messages: Message[];
    isActive: boolean;
    startedAt: string;
    endedAt?: string;
}

const LiveChat = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    
    const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to access chat");
            navigate("/login");
            return;
        }

        if (appointmentId) {
            fetchAppointment();
            fetchChatRoom();
        }
    }, [appointmentId, isAuthenticated, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [chatRoom?.messages]);

    // Periodic check for consultation status updates (every 10 seconds for 3-minute consultations)
    useEffect(() => {
        if (!appointmentId || !chatRoom || chatRoom.appointment.consultationStatus !== "in_progress") {
            return;
        }

        const statusCheckInterval = setInterval(() => {
            fetchAppointment();
            fetchChatRoom();
        }, 10000); // Check every 10 seconds for faster updates

        return () => clearInterval(statusCheckInterval);
    }, [appointmentId, chatRoom?.appointment.consultationStatus]);

    const fetchAppointment = async () => {
        try {
            const response = await appointmentAPI.getAppointmentById(appointmentId!);
            setAppointment(response.data.data);
        } catch (error: any) {
            toast.error("Failed to fetch appointment details");
        }
    };

    const fetchChatRoom = async () => {
        try {
            setLoading(true);
            const response = await livechatAPI.getChatRoom(appointmentId!);
            setChatRoom(response.data.data);
        } catch (error: any) {
            // Chat room doesn't exist yet
            setChatRoom(null);
        } finally {
            setLoading(false);
        }
    };

    const createChatRoom = async () => {
        if (!appointmentId) return;

        setCreating(true);
        try {
            const response = await livechatAPI.createChatRoom(appointmentId);
            setChatRoom(response.data.data);
            toast.success("Chat room created successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create chat room");
        } finally {
            setCreating(false);
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || !chatRoom || !appointmentId) return;

        setSending(true);
        try {
            const response = await livechatAPI.sendMessage(appointmentId, message.trim());
            
            // Add new message to chat room
            setChatRoom(prev => prev ? {
                ...prev,
                messages: [...prev.messages, response.data.data]
            } : null);
            
            setMessage("");
            toast.success("Message sent successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const endChatRoom = async () => {
        if (!chatRoom || !appointmentId) return;

        if (!confirm("Are you sure you want to end this consultation?")) return;

        try {
            await livechatAPI.endChatRoom(appointmentId);
            setChatRoom(prev => prev ? { ...prev, isActive: false } : null);
            toast.success("Chat room ended successfully");
        } catch (error: any) {
            toast.error("Failed to end chat room");
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const canCreateChatRoom = () => {
        if (!appointment || !currentUser) return false;
        
        // Check if user is part of the appointment
        const isPatient = appointment.patient._id === currentUser._id;
        const isDoctor = appointment.doctor._id === currentUser._id;
        
        if (!isPatient && !isDoctor) return false;
        
        // Check if appointment is confirmed
        if (appointment.status !== "confirmed") return false;
        
        // Check if consultation time has started
        const appointmentDateTime = new Date(appointment.appointmentDate);
        appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
        appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));
        
        return new Date() >= appointmentDateTime;
    };

    const canEndChatRoom = () => {
        return chatRoom?.isActive && currentUser?.role === "doctor" && 
               appointment?.doctor._id === currentUser._id;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment not found</h2>
                    <button
                        onClick={() => navigate("/appointments")}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Back to Appointments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                    <div className="px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    <FiArrowLeft className="w-5 h-5 mr-2" />
                                    Back
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        Consultation Chat
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {appointment.patient.name} ↔ Dr. {appointment.doctor.name}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                {canEndChatRoom() && (
                                    <button
                                        onClick={endChatRoom}
                                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                    >
                                        <FiX className="w-4 h-4" />
                                        End Consultation
                                    </button>
                                )}
                                
                                {!chatRoom && canCreateChatRoom() && (
                                    <button
                                        onClick={createChatRoom}
                                        disabled={creating}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                                    >
                                        <FiMessageSquare className="w-4 h-4" />
                                        {creating ? "Creating..." : "Start Chat"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Appointment Info Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Appointment Details
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <FiCalendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiClock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {appointment.appointmentTime}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiUser className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {appointment.doctor.specialty}
                                    </span>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                    <FiFileText className="w-4 h-4 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Reason:</p>
                                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                                    </div>
                                </div>
                                
                                <div className="pt-3 border-t border-gray-100">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        appointment.status === "confirmed" ? "bg-green-100 text-green-800" :
                                        appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                        "bg-gray-100 text-gray-800"
                                    }`}>
                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {chatRoom ? "Live Consultation" : "Consultation Chat"}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {chatRoom ? 
                                                (chatRoom.isActive ? "Active" : "Ended") : 
                                                "Click 'Start Chat' to begin consultation"
                                            }
                                        </p>
                                    </div>
                                    
                                    {chatRoom && (
                                        <div className="flex items-center space-x-2">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                <FiVideo className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                <FiMic className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Consultation Timer */}
                                {chatRoom && chatRoom.appointment.consultationStatus === "in_progress" && chatRoom.appointment.consultationStartTime && (
                                    <div className="mt-3">
                                        <ConsultationTimer 
                                            startTime={chatRoom.appointment.consultationStartTime}
                                            onTimeUp={() => {
                                                toast.success("Consultation completed! You can now rate the doctor.");
                                                // Refresh chat room data to get updated consultation status
                                                setTimeout(() => {
                                                    fetchChatRoom();
                                                    fetchAppointment();
                                                }, 2000); // Wait 2 seconds for backend to update
                                            }}
                                        />
                                    </div>
                                )}
                                
                                {chatRoom && chatRoom.appointment.consultationStatus === "completed" && (
                                    <div className="mt-3">
                                        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                                            <FiClock className="w-4 h-4" />
                                            <span className="text-sm font-medium">Consultation Completed - You can now rate the doctor</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {!chatRoom ? (
                                    <div className="text-center py-12">
                                        <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No chat room yet
                                        </h3>
                                        <p className="text-gray-600">
                                            {canCreateChatRoom() 
                                                ? "Click 'Start Chat' to begin your consultation"
                                                : "Chat room will be available when consultation time starts"
                                            }
                                        </p>
                                    </div>
                                ) : chatRoom.messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No messages yet
                                        </h3>
                                        <p className="text-gray-600">
                                            Start the conversation by sending a message
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {chatRoom.messages.map((msg) => (
                                            <div
                                                key={msg._id}
                                                className={`flex ${msg.sender._id === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                    msg.sender._id === currentUser?._id
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 text-gray-900"
                                                }`}>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="text-xs font-medium">
                                                            {msg.sender.name}
                                                        </span>
                                                        <span className="text-xs opacity-75">
                                                            {msg.sender.role === "doctor" ? "👨‍⚕️" : "👤"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className="text-xs opacity-75 mt-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            {chatRoom && chatRoom.isActive && chatRoom.appointment.consultationStatus !== "completed" && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex space-x-3">
                                        <input
                                            ref={messageInputRef}
                                            type="text"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type your message..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={sending}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!message.trim() || sending}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                        >
                                            <FiSend className="w-4 h-4" />
                                            {sending ? "Sending..." : "Send"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Rate Doctor Button - Show when consultation is completed */}
                            {chatRoom && chatRoom.appointment.consultationStatus === "completed" && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-4">
                                            Your consultation has been completed. You can now rate and review the doctor.
                                        </p>
                                        <button
                                            onClick={() => navigate(`/rating/${appointmentId}`)}
                                            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2 mx-auto"
                                        >
                                            <FiMessageSquare className="w-4 h-4" />
                                            <span>Rate & Review Doctor</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveChat;
