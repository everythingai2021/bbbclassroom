"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";



interface MeetingRoom {
    id: string;
    name: string;
    level: string;
    status: 'idle' | 'starting' | 'running' | 'stopped';
    participantCount: number;
    recordingStatus: 'not-recording' | 'recording' | 'processing';
}

const AdminPage = () => {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([
        {
            id: 'general',
            name: 'General',
            level: 'all',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        },
        {
            id: 'general-2',
            name: 'General 2',
            level: 'all',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        },
        {
            id: 'beginner-scratch',
            name: 'Beginner Scratch',
            level: 'beginner',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        },
        {
            id: 'intermediate-scratch',
            name: 'Intermediate Scratch',
            level: 'intermediate',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        },
        {
            id: 'python-1',
            name: 'Python 1',
            level: 'python',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        },
        {
            id: 'python-2',
            name: 'Python 2',
            level: 'python',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        },
        {
            id: 'web-dev',
            name: 'Web Dev',
            level: 'web',
            status: 'idle',
            participantCount: 0,
            recordingStatus: 'not-recording'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkAdminAccess = () => {
            const currentUser = localStorage.getItem("name");
            
            if (currentUser === process.env.NEXT_PUBLIC_ADMIN_USERNAME) {
                setIsAdmin(true);
                fetchMeetingStatuses();
            } else {
                router.push("/");
            }
        };

        checkAdminAccess();
    }, [router]);

    const fetchMeetingStatuses = async () => {
        setIsLoading(true);
        try {
            const updatedRooms = await Promise.all(
                meetingRooms.map(async (room) => {
                    try {
                        const response = await fetch(`/api/admin/meeting-status?meetingID=${room.id}`);
                        const data = await response.json();
                        
                        return {
                            ...room,
                            status: (data.exists ? (data.running ? 'running' : 'idle') : 'stopped') as 'idle' | 'starting' | 'running' | 'stopped',
                            participantCount: data.participantCount || 0,
                            recordingStatus: (data.recordingStatus || 'not-recording') as 'not-recording' | 'recording' | 'processing'
                        };
                    } catch (error) {
                        console.error(`Error fetching status for ${room.name}:`, error);
                        return { ...room, status: 'stopped' as const, participantCount: 0, recordingStatus: 'not-recording' as const };
                    }
                })
            );
            
            setMeetingRooms(updatedRooms);
        } catch (error) {
            console.error('Error fetching meeting statuses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const startMeeting = async (roomId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/start-meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    meetingID: roomId,
                    enableRecording: true
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                // Update the room status
                setMeetingRooms(prev => prev.map(room => 
                    room.id === roomId 
                        ? { ...room, status: 'running', recordingStatus: 'recording' }
                        : room
                ));
            } else {
                alert('Failed to start meeting: ' + data.error);
            }
        } catch (error) {
            console.error('Error starting meeting:', error);
            alert('Error starting meeting');
        } finally {
            setIsLoading(false);
        }
    };

    const stopMeeting = async (roomId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/stop-meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ meetingID: roomId }),
            });

            const data = await response.json();
            
            if (data.success) {
                // Update the room status
                setMeetingRooms(prev => prev.map(room => 
                    room.id === roomId 
                        ? { ...room, status: 'stopped', participantCount: 0, recordingStatus: 'not-recording' }
                        : room
                ));
            } else {
                alert('Failed to stop meeting: ' + data.error);
            }
        } catch (error) {
            console.error('Error stopping meeting:', error);
            alert('Error stopping meeting');
        } finally {
            setIsLoading(false);
        }
    };

    const joinMeeting = async (roomId: string) => {
        setIsLoading(true);
        try {
            const adminName = localStorage.getItem("name");
            if (!adminName) {
                alert('Admin name not found. Please log in again.');
                return;
            }

            // Determine the level based on room ID
            let level = "all";
            switch (roomId) {
                case "beginner-scratch":
                    level = "beginner";
                    break;
                case "intermediate-scratch":
                    level = "intermediate";
                    break;
                case "python-1":
                case "python-2":
                    level = "python";
                    break;
                case "web-dev":
                    level = "web";
                    break;
                case "general":
                case "general-2":
                default:
                    level = "all";
                    break;
            }

            const response = await fetch(`/api/bbb?name=${encodeURIComponent(adminName)}&level=${level}&roomId=${roomId}`);
            const data = await response.json();

            if (data.joinUrl) {
                // Open the meeting in a new tab
                window.open(data.joinUrl, '_blank');
            } else {
                alert("No meeting found or meeting is not running");
            }
        } catch (error) {
            console.error('Error joining meeting:', error);
            alert('Error joining meeting');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-100 text-green-800';
            case 'starting': return 'bg-yellow-100 text-yellow-800';
            case 'stopped': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRecordingStatusColor = (status: string) => {
        switch (status) {
            case 'recording': return 'bg-red-100 text-red-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
            case 'starting': return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
            case 'stopped': return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
            );
            default: return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
    };

    const getRecordingStatusIcon = (status: string) => {
        switch (status) {
            case 'recording': return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
            case 'processing': return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
            default: return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                    <p className="text-gray-600">You don&apos;t have permission to access the admin panel</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
                            <p className="text-gray-600">Manage BigBlueButton meeting rooms</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={fetchMeetingStatuses}
                                disabled={isLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Refreshing...' : 'Refresh Status'}
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meeting Rooms Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {meetingRooms.map((room) => (
                        <div key={room.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">{room.name}</h3>
                                <p className="text-sm text-gray-500 capitalize">{room.level} Level</p>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-center mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                                    {getStatusIcon(room.status)}
                                    <span className="ml-1 capitalize">{room.status}</span>
                                </span>
                            </div>

                            {/* Recording Status */}
                            <div className="flex items-center justify-center mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRecordingStatusColor(room.recordingStatus)}`}>
                                    {getRecordingStatusIcon(room.recordingStatus)}
                                    <span className="ml-1 capitalize">{room.recordingStatus.replace('-', ' ')}</span>
                                </span>
                            </div>

                            {/* Participant Count */}
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-600">Participants</p>
                                <p className="text-2xl font-bold text-gray-800">{room.participantCount}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                {room.status === 'stopped' || room.status === 'idle' ? (
                                    <button
                                        onClick={() => startMeeting(room.id)}
                                        disabled={isLoading}
                                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Starting...' : 'Start Meeting'}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => stopMeeting(room.id)}
                                            disabled={isLoading}
                                            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            {isLoading ? 'Stopping...' : 'Stop Meeting'}
                                        </button>
                                        <button
                                            onClick={() => joinMeeting(room.id)}
                                            disabled={isLoading}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            Join Meeting
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
};

export default AdminPage; 