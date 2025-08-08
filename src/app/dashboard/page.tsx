"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Iframe from "react-iframe";

const DashboardPage = () => {
    const router = useRouter();
    const [name, setName] = useState("");
    const [level, setLevel] = useState("");
    const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const name = localStorage.getItem("name");
        const level = localStorage.getItem("level");
        if (!name || !level) {
            router.push("/");
        }
        setName(name || "");
        setLevel(level || "");
    }, []);

    const handleGeneralMeetingRoom = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/bbb?name=" + name);
            const data = await response.json();

            if (data.joinUrl) {
                setMeetingUrl(data.joinUrl);
                setSidebarOpen(false); // Close sidebar on mobile when meeting starts
            } else {
                alert("No meeting found");
            }
        } catch (error) {
            alert("Error joining meeting");
        } finally {
            setIsLoading(false);
        }
    }

    const handleGroupMeetingRoom = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/bbb?name=" + name + "&level=" + level);
            const data = await response.json();

            if (data.joinUrl) {
                setMeetingUrl(data.joinUrl);
                setSidebarOpen(false); // Close sidebar on mobile when meeting starts
            } else {
                alert("No meeting found");
            }
        } catch (error) {
            alert("Error joining meeting");
        } finally {
            setIsLoading(false);
        }
    }

    if (name && level) { 
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    <div className="flex flex-col h-full p-6">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between mb-6 lg:hidden">
                            <h2 className="text-lg font-semibold text-gray-800">Meeting Controls</h2>
                            <button 
                                onClick={() => setSidebarOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="mb-8">
                            <div className="bg-blue-100 rounded-lg p-4 mb-6">
                                <p className="text-sm text-gray-600">Logged in as</p>
                                <p className="font-semibold text-gray-800">{name}</p>
                                <p className="text-xs text-gray-500 capitalize">{level} Level</p>
                            </div>
                            
                            {/* Admin Panel Button - only show for admin users */}
                            {(name === process.env.NEXT_PUBLIC_ADMIN_USERNAME) && (
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors mb-6"
                                >
                                    Admin Panel
                                </button>
                            )}
                        </div>

                        {/* Meeting Controls */}
                        <div className="space-y-4 flex-1">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">General Meeting</h3>
                                    <p className="text-sm text-gray-600 mb-4">Join the main meeting room for all participants</p>
                                    <button 
                                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                                            isLoading 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                                        }`}
                                        onClick={handleGeneralMeetingRoom}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Joining...' : 'Join General Meeting'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Group Meeting</h3>
                                    <p className="text-sm text-gray-600 mb-4">Join your level-specific group meeting</p>
                                    <button 
                                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                                            isLoading 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                                        }`}
                                        onClick={handleGroupMeetingRoom}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Joining...' : 'Join Group Meeting'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Meeting Room */}
                <div className="flex-1 flex flex-col">
                    {/* Mobile Header */}
                    <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-semibold text-gray-800">Meeting Dashboard</h1>
                        <div className="w-6"></div> {/* Spacer for centering */}
                    </div>

                    <div className="flex-1 p-4 lg:p-6">
                        {meetingUrl ? (
                            <div className="bg-white rounded-2xl shadow-lg h-full">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h3 className="text-lg font-semibold text-gray-800">Meeting Room</h3>
                                    <button 
                                        onClick={() => setMeetingUrl(null)}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="h-[calc(100vh-200px)] lg:h-[calc(100vh-120px)]">
                                    <Iframe 
                                        url={meetingUrl}
                                        width="100%"
                                        height="100%"
                                        id="meetingFrame"
                                        className="rounded-b-2xl border-0"
                                        display="block"
                                        position="relative"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg h-full flex items-center justify-center">
                                <div className="text-center p-6">
                                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                                        <svg className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-semibold text-gray-800 mb-2">No Meeting Active</h3>
                                    <p className="text-sm lg:text-base text-gray-600">Click the menu button and select a meeting to join</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                <p className="text-gray-600">Please log in to access the dashboard</p>
            </div>
        </div>
    )
}

export default DashboardPage;