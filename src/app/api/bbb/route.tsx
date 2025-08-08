import { NextResponse } from "next/server";
import crypto from "crypto";

// Helper function to generate BigBlueButton checksum
const generateChecksum = (type: string, queryString: string, secret: string) => {
    return crypto.createHash('sha256').update(type +queryString + secret).digest('hex');
};

export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        let fullName = searchParams.get('name') as string;
        let role = "VIEWER";

        if (fullName === process.env.NEXT_PUBLIC_ADMIN_USERNAME) {
            fullName = "Admin";
            role = "MODERATOR";
        }

        const level = searchParams.get('level') as string;

        let meetingID = process.env.NEXT_PUBLIC_GENERAL_ID as string;

        //Set the meeting ID based on the level
        switch (level) {
            case "beginner":
                meetingID = process.env.NEXT_PUBLIC_BEGINNER_ID as string;
                break;
            case "intermediate":
                meetingID = process.env.NEXT_PUBLIC_INTERMEDIATE_ID as string;
                break;
            case "elite":
                meetingID = process.env.NEXT_PUBLIC_ELITE_ID as string;
                break;
        }

        const bbbUrl = process.env.NEXT_PUBLIC_BBB_URL as string;
        const bbbSecret = process.env.NEXT_PUBLIC_BBB_SECRET as string;

        if (!bbbUrl || !bbbSecret) {
            return NextResponse.json({ 
                error: "BigBlueButton configuration missing" 
            }, { status: 500 });
        }

        //Set the query params for the join request
        const queryParams = new URLSearchParams({
            meetingID,
            fullName,
            role,
        });

        const queryString = queryParams.toString();

        //Generate the checksum for the join request
        const checksum = generateChecksum("join", queryString, bbbSecret);

        //Check if the meeting exists
        const meetingInfo = await checkMeetingStatus(queryString, bbbSecret);

        if (!meetingInfo?.exists) {
            return NextResponse.json({ 
                error: "No meeting found" 
            }, { status: 400 });
        }

        //Construct the join URL
        const joinUrl = `${bbbUrl}/api/join?${queryString}&checksum=${checksum}`;
        
        return NextResponse.json({ 
            joinUrl,
            meetingID,
            fullName 
        });

    } catch (error) {
        console.error('Error in GET /api/general:', error);
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
};

const checkMeetingStatus = async (queryString: string, bbbSecret: string) => {
    const bbbUrl = process.env.NEXT_PUBLIC_BBB_URL as string;
    const checksum = generateChecksum("getMeetingInfo", queryString, bbbSecret);
    const meetingInfoUrl = `${bbbUrl}/api/getMeetingInfo?${queryString}&checksum=${checksum}`;
    
    try {
        const response = await fetch(meetingInfoUrl);
        const xmlText = await response.text(); // Get response as text instead of JSON
        
        console.log('Raw XML response:', xmlText);
        
        // Parse XML to extract useful information
        const meetingInfo = parseMeetingInfoXML(xmlText);
        console.log('Parsed meeting info:', meetingInfo);
        
        return meetingInfo;
    } catch (error) {
        console.error('Error checking meeting status:', error);
        return null;
    }
};

// Helper function to parse BigBlueButton XML response
const parseMeetingInfoXML = (xmlText: string) => {
    try {
        //Check if the meeting exists
        const meetingExists = xmlText.includes('<meetingID>');
        const hasError = xmlText.includes('<returncode>FAILED</returncode>');
        
        if (hasError) {
            const errorMatch = xmlText.match(/<messageKey>(.*?)<\/messageKey>/);
            const messageMatch = xmlText.match(/<message>(.*?)<\/message>/);
            
            return {
                exists: false,
                error: messageMatch ? messageMatch[1] : 'Unknown error',
                errorKey: errorMatch ? errorMatch[1] : 'unknown'
            };
        }
        
        if (meetingExists) {
            // Extract basic meeting information
            const meetingIdMatch = xmlText.match(/<meetingID>(.*?)<\/meetingID>/);
            const meetingNameMatch = xmlText.match(/<meetingName>(.*?)<\/meetingName>/);
            const participantCountMatch = xmlText.match(/<participantCount>(.*?)<\/participantCount>/);
            const runningMatch = xmlText.match(/<running>(.*?)<\/running>/);
            
            return {
                exists: true,
                meetingID: meetingIdMatch ? meetingIdMatch[1] : '',
                meetingName: meetingNameMatch ? meetingNameMatch[1] : '',
                participantCount: participantCountMatch ? parseInt(participantCountMatch[1]) : 0,
                running: runningMatch ? runningMatch[1] === 'true' : false,
                rawXML: xmlText // Keep raw XML for debugging
            };
        }
        
        return {
            exists: false,
            error: 'Meeting not found'
        };
        
    } catch (error) {
        console.error('Error parsing XML:', error);
        return {
            exists: false,
            error: 'Failed to parse XML response',
            rawXML: xmlText
        };
    }
};