import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { healthtipsAPI } from "../services/api";
import { toast } from "react-hot-toast";
import {
    FiSave,
    FiEye,
    FiEyeOff,
    FiTag,
    FiFileText,
    FiBookOpen,
    FiArrowLeft,
} from "react-icons/fi";

const CreateHealthTip = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "",
        tags: "",
        isPublished: false,
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to create health tips");
            navigate("/login");
            return;
        }

        if (currentUser?.role !== "doctor") {
            toast.error("Only doctors can create health tips");
            navigate("/healthtips");
            return;
        }

        fetchCategories();
    }, [isAuthenticated, currentUser, navigate]);

    const fetchCategories = async () => {
        try {
            const response = await healthtipsAPI.getCategories();
            setCategories(response.data.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const tagsArray = formData.tags
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            const healthTipData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                category: formData.category,
                tags: tagsArray,
                isPublished: formData.isPublished,
            };

            await healthtipsAPI.createHealthTip(healthTipData);
            toast.success("Health tip created successfully!");
            navigate("/healthtips");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create health tip");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-4"
                    >
                        <FiArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create Health Tip
                    </h1>
                    <p className="text-gray-600">
                        Share valuable health insights and medical advice with your patients
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiFileText className="inline w-4 h-4 mr-2" />
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                maxLength={200}
                                placeholder="Enter a clear and descriptive title..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.title.length}/200 characters
                            </p>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiBookOpen className="inline w-4 h-4 mr-2" />
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a category</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiFileText className="inline w-4 h-4 mr-2" />
                                Content *
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                required
                                rows={8}
                                placeholder="Write your health tip content here. Be clear, informative, and helpful..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiTag className="inline w-4 h-4 mr-2" />
                                Tags
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="Enter tags separated by commas (e.g., nutrition, exercise, wellness)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Separate multiple tags with commas
                            </p>
                        </div>

                        {/* Publish Option */}
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label className="flex items-center text-sm text-gray-700">
                                <FiEye className="w-4 h-4 mr-2" />
                                Publish immediately
                            </label>
                            <span className="text-xs text-gray-500">
                                (Uncheck to save as draft)
                            </span>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex space-x-4 pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-5 h-5 mr-2" />
                                        {formData.isPublished ? "Create & Publish" : "Save as Draft"}
                                    </>
                                )}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => navigate("/healthtips")}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateHealthTip;
