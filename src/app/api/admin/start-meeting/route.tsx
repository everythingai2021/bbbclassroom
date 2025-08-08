import { NextResponse } from "next/server";
import crypto from "crypto";

// Helper function to generate BigBlueButton checksum
const generateChecksum = (action: string, params: string, secret: string) => {
    const queryString = `${action}${params}${secret}`;
    return crypto.createHash('sha256').update(queryString).digest('hex');
};

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { meetingID, enableRecording = true } = body;

        if (!meetingID) {
            return NextResponse.json({ 
                success: false,
                error: "Meeting ID is required" 
            }, { status: 400 });
        }

        const bbbUrl = process.env.NEXT_PUBLIC_BBB_URL as string;
        const bbbSecret = process.env.NEXT_PUBLIC_BBB_SECRET as string;

        if (!bbbUrl || !bbbSecret) {
            return NextResponse.json({ 
                success: false,
                error: "BigBlueButton configuration missing" 
            }, { status: 500 });
        }

        // Get meeting name based on meeting ID
        const getMeetingName = (id: string) => {
            switch (id) {
                case 'general-room':
                    return 'General Room';
                case 'beginner-room':
                    return 'Beginner Room';
                case 'intermediate-room':
                    return 'Intermediate Room';
                case 'elite-room':
                    return 'Elite Room';
                default:
                    return id;
            }
        };

        const meetingName = getMeetingName(meetingID);

        // Build query parameters with recording options
        const params: Record<string, string> = {
            meetingID,
            name: meetingName,
        };

        // Add recording parameters if enabled
        if (enableRecording) {
            params.record = 'true';
            params.autoStartRecording = 'true';
            params.allowStartStopRecording = 'true';
        }

        // Build query string
        const queryString = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        console.log('Query string:', queryString);
        // Generate checksum
        const checksum = generateChecksum("create", queryString, bbbSecret);

        // Build final URL
        const url = `${bbbUrl}/api/create?${queryString}&checksum=${checksum}`;

        console.log('Creating meeting with URL:', url);

        try {
            const response = await fetch(url);
            const responseText = await response.text();
            
            console.log('BigBlueButton response:', responseText);

            if (response.ok) {
                return NextResponse.json({ 
                    success: true,
                    message: `Successfully created meeting: ${meetingName} (ID: ${meetingID})${enableRecording ? ' with recording enabled' : ''}`,
                    meetingID,
                    meetingName,
                    recordingEnabled: enableRecording
                });
            } else {
                return NextResponse.json({ 
                    success: false,
                    error: `Failed to create meeting: ${response.status} ${response.statusText}`,
                    response: responseText
                }, { status: 500 });
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
            return NextResponse.json({ 
                success: false,
                error: `Error creating meeting: ${error}`
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in POST /api/admin/start-meeting:', error);
        return NextResponse.json({ 
            success: false,
            error: "Internal server error" 
        }, { status: 500 });
    }
}; 