import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { healthtipsAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import {
    FiHeart,
    FiEye,
    FiCalendar,
    FiUser,
    FiTag,
    FiSearch,
    FiFilter,
    FiRefreshCw,
    FiBookOpen,
} from "react-icons/fi";

interface HealthTip {
    _id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    publishedAt: string;
    views: number;
    likes: number;
    doctor: {
        _id: string;
        name: string;
        specialty: string;
    };
    createdAt: string;
}

const HealthTips = () => {
    const { user: currentUser } = useAuthStore();
    const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("publishedAt");
    const [categories, setCategories] = useState<string[]>([]);
    const [showFullContent, setShowFullContent] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
        fetchHealthTips();
    }, [currentPage, selectedCategory, searchQuery, sortBy]);

    const fetchCategories = async () => {
        try {
            const response = await healthtipsAPI.getCategories();
            setCategories(response.data.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchHealthTips = async () => {
        try {
            setLoading(true);
            const response = await healthtipsAPI.getPublishedHealthTips({
                page: currentPage,
                limit: 12,
                category: selectedCategory === "all" ? undefined : selectedCategory,
                search: searchQuery || undefined,
                sortBy,
            });

            if (response.data.success) {
                setHealthTips(response.data.data.healthTips);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch health tips");
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (id: string) => {
        try {
            await healthtipsAPI.toggleLike(id);
            // Update the like count locally
            setHealthTips(prev =>
                prev.map(tip =>
                    tip._id === id ? { ...tip, likes: tip.likes + 1 } : tip
                )
            );
            toast.success("Health tip liked!");
        } catch (error: any) {
            toast.error("Failed to like health tip");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchHealthTips();
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const handleSortChange = (sort: string) => {
        setSortBy(sort);
        setCurrentPage(1);
    };

    const toggleContent = (id: string) => {
        setShowFullContent(showFullContent === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + "...";
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view health tips</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Health Tips & Articles
                            </h1>
                            <p className="text-gray-600">
                                Discover valuable health insights and medical advice from our expert doctors
                            </p>
                        </div>
                        {currentUser?.role === "doctor" && (
                            <Link
                                to="/create-healthtip"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                <FiBookOpen className="w-4 h-4 mr-2" />
                                Create Health Tip
                            </Link>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Search */}
                        <div className="flex-1">
                            <form onSubmit={handleSearch} className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search health tips..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </form>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center space-x-4">
                            <FiFilter className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="publishedAt">Latest</option>
                                <option value="views">Most Viewed</option>
                                <option value="likes">Most Liked</option>
                            </select>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={fetchHealthTips}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Health Tips Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading health tips...</p>
                    </div>
                ) : healthTips.length === 0 ? (
                    <div className="text-center py-12">
                        <FiBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No health tips found
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery || selectedCategory !== "all"
                                ? "Try adjusting your search or filters"
                                : "Check back later for new health tips from our doctors"
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {healthTips.map((tip) => (
                            <div
                                key={tip._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {tip.category}
                                        </span>
                                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <FiEye className="w-4 h-4" />
                                                <span>{tip.views}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <FiHeart className="w-4 h-4" />
                                                <span>{tip.likes}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {tip.title}
                                    </h3>

                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                        <div className="flex items-center space-x-1">
                                            <FiUser className="w-4 h-4" />
                                            <span>Dr. {tip.doctor.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <FiCalendar className="w-4 h-4" />
                                            <span>{formatDate(tip.publishedAt)}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {showFullContent === tip._id
                                            ? tip.content
                                            : truncateContent(tip.content)
                                        }
                                    </p>

                                    {tip.content.length > 150 && (
                                        <button
                                            onClick={() => toggleContent(tip._id)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                                        >
                                            {showFullContent === tip._id ? "Show less" : "Read more"}
                                        </button>
                                    )}
                                </div>

                                {/* Tags */}
                                {tip.tags.length > 0 && (
                                    <div className="px-6 pb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {tip.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                                >
                                                    <FiTag className="w-3 h-3 mr-1" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            {tip.doctor.specialty}
                                        </span>
                                        <button
                                            onClick={() => handleLike(tip._id)}
                                            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                                        >
                                            <FiHeart className="w-4 h-4" />
                                            <span>Like</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                                        currentPage === page
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthTips;
