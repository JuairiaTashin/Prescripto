import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { paymentAPI, appointmentAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { FiCreditCard, FiPhone, FiHash, FiShield, FiCalendar, FiClock, FiArrowLeft } from "react-icons/fi";

type Method = "bkash" | "card" | "aamarPay";

const PaymentPage = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<"pending" | "completed" | "failed" | "expired" | null>(null);
    const [amount, setAmount] = useState<number | null>(null);
    const [deadline, setDeadline] = useState<string>("");
    const [appointment, setAppointment] = useState<any>(null);
    const [method, setMethod] = useState<Method>("bkash");
    const [bkash, setBkash] = useState({ phoneNumber: "", transactionId: "" });
    const [card, setCard] = useState({ cardNumber: "", cardholderName: "", expiryDate: "", cvv: "" });

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]);

    const init = async () => {
        if (!appointmentId) return;
        try {
            setLoading(true);
            const [aptRes, statusRes] = await Promise.all([
                appointmentAPI.getAppointmentById(appointmentId),
                paymentAPI.checkPaymentStatus(appointmentId),
            ]);
            setAppointment(aptRes.data.data);
            setStatus(statusRes.data.data.status);
            setAmount(statusRes.data.data.amount);
            setDeadline(statusRes.data.data.paymentDeadline);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to load payment info");
        } finally {
            setLoading(false);
        }
    };

    const submitPayment = async () => {
        if (!appointmentId) return;
        setSubmitting(true);
        try {
            if (method === "bkash") {
                if (!bkash.phoneNumber || !bkash.transactionId) {
                    toast.error("Provide bKash phone number and transaction ID");
                    setSubmitting(false);
                    return;
                }
                await paymentAPI.processBkashPayment(appointmentId, bkash);
            } else if (method === "card") {
                const { cardNumber, cardholderName, expiryDate, cvv } = card;
                if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
                    toast.error("Provide complete card details");
                    setSubmitting(false);
                    return;
                }
                await paymentAPI.processCardPayment(appointmentId, card);
            } else {
                // Simulate aamarPay redirect-success for demo
                const fakeTxn = `AAP-${Date.now()}`;
                await paymentAPI.processAamarPayPayment(appointmentId, { transactionId: fakeTxn, gatewayResponse: { ok: true } });
            }
            toast.success("Payment completed");
            await init();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Payment failed");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (s: string) => new Date(s).toLocaleString();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-blue-600">
                        <FiArrowLeft className="w-5 h-5 mr-2" /> Back
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Payment</h1>
                    <p className="text-sm text-gray-600 mb-6">Complete payment before the deadline to confirm your appointment.</p>

                    {appointment && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="flex items-center space-x-2 text-sm text-gray-700"><FiCalendar className="w-4 h-4" /> <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span></div>
                            <div className="flex items-center space-x-2 text-sm text-gray-700"><FiClock className="w-4 h-4" /> <span>{appointment.appointmentTime}</span></div>
                            <div className="text-sm text-gray-700">Amount: <span className="font-semibold">{amount !== null ? `৳${amount}` : "-"}</span></div>
                        </div>
                    )}

                    <div className="mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            status === "completed" ? "bg-green-100 text-green-800" :
                            status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            status === "expired" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                        }`}>{status?.toUpperCase()}</span>
                        {deadline && (
                            <p className="text-xs text-gray-500 mt-2">Deadline: {formatDate(deadline)}</p>
                        )}
                    </div>

                    {status === "pending" && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                <select value={method} onChange={(e) => setMethod(e.target.value as Method)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="bkash">bKash</option>
                                    <option value="card">Card</option>
                                    <option value="aamarPay">aamarPay (Gateway)</option>
                                </select>
                            </div>

                            {method === "bkash" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg px-3">
                                            <FiPhone className="w-4 h-4 text-gray-400 mr-2" />
                                            <input className="w-full py-2 focus:outline-none" value={bkash.phoneNumber} onChange={(e)=>setBkash({...bkash, phoneNumber: e.target.value})} placeholder="01XXXXXXXXX" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg px-3">
                                            <FiHash className="w-4 h-4 text-gray-400 mr-2" />
                                            <input className="w-full py-2 focus:outline-none" value={bkash.transactionId} onChange={(e)=>setBkash({...bkash, transactionId: e.target.value})} placeholder="TrxID" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === "card" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg px-3">
                                            <FiCreditCard className="w-4 h-4 text-gray-400 mr-2" />
                                            <input className="w-full py-2 focus:outline-none" value={card.cardNumber} onChange={(e)=>setCard({...card, cardNumber: e.target.value})} placeholder="1234 5678 9012 3456" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" value={card.cardholderName} onChange={(e)=>setCard({...card, cardholderName: e.target.value})} placeholder="Full Name" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (MM/YY)</label>
                                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" value={card.expiryDate} onChange={(e)=>setCard({...card, expiryDate: e.target.value})} placeholder="MM/YY" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg px-3">
                                            <FiShield className="w-4 h-4 text-gray-400 mr-2" />
                                            <input className="w-full py-2 focus:outline-none" value={card.cvv} onChange={(e)=>setCard({...card, cvv: e.target.value})} placeholder="***" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === "aamarPay" && (
                                <div className="mb-4 text-sm text-gray-700">
                                    You will be redirected to aamarPay gateway simulation. Click "Pay Now" to proceed.
                                </div>
                            )}

                            <button onClick={submitPayment} disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                                {submitting ? "Processing..." : "Pay Now"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;