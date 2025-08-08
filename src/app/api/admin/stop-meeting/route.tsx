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
        const { meetingID } = body;

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

        // Build query parameters for ending meeting
        const params = {
            meetingID,
            password: "mp", // Default moderator password
        };

        // Build query string
        const queryString = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        // Generate checksum
        const checksum = generateChecksum("end", queryString, bbbSecret);

        // Build final URL
        const url = `${bbbUrl}/api/end?${queryString}&checksum=${checksum}`;

        console.log('Ending meeting with URL:', url);

        try {
            const response = await fetch(url);
            const responseText = await response.text();
            
            console.log('BigBlueButton response:', responseText);

            if (response.ok) {
                return NextResponse.json({ 
                    success: true,
                    message: `Successfully ended meeting: ${meetingID}`,
                    meetingID
                });
            } else {
                return NextResponse.json({ 
                    success: false,
                    error: `Failed to end meeting: ${response.status} ${response.statusText}`,
                    response: responseText
                }, { status: 500 });
            }
        } catch (error) {
            console.error('Error ending meeting:', error);
            return NextResponse.json({ 
                success: false,
                error: `Error ending meeting: ${error}`
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in POST /api/admin/stop-meeting:', error);
        return NextResponse.json({ 
            success: false,
            error: "Internal server error" 
        }, { status: 500 });
    }
}; 