import { NextResponse } from "next/server";
import crypto from "crypto";

// Helper function to generate BigBlueButton checksum
const generateChecksum = (type: string, queryString: string, secret: string) => {
    return crypto.createHash('sha256').update(type + queryString + secret).digest('hex');
};

export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const meetingID = searchParams.get('meetingID') as string;

        if (!meetingID) {
            return NextResponse.json({ 
                error: "Meeting ID is required" 
            }, { status: 400 });
        }

        const bbbUrl = process.env.NEXT_PUBLIC_BBB_URL as string;
        const bbbSecret = process.env.NEXT_PUBLIC_BBB_SECRET as string;

        if (!bbbUrl || !bbbSecret) {
            return NextResponse.json({ 
                error: "BigBlueButton configuration missing" 
            }, { status: 500 });
        }

        const queryParams = new URLSearchParams({
            meetingID,
        });

        const queryString = queryParams.toString();
        const meetingInfo = await checkMeetingStatus(queryString, bbbSecret);
        
        return NextResponse.json(meetingInfo);

    } catch (error) {
        console.error('Error in GET /api/admin/meeting-status:', error);
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
        const xmlText = await response.text();
        
        console.log('Raw XML response:', xmlText);
        
        // Parse XML to extract useful information
        const meetingInfo = parseMeetingInfoXML(xmlText);
        console.log('Parsed meeting info:', meetingInfo);
        
        return meetingInfo;
    } catch (error) {
        console.error('Error checking meeting status:', error);
        return {
            exists: false,
            error: 'Failed to check meeting status'
        };
    }
};

// Helper function to parse BigBlueButton XML response
const parseMeetingInfoXML = (xmlText: string) => {
    try {
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
            
            // Extract recording information
            const recordingMatch = xmlText.match(/<recording>(.*?)<\/recording>/);
            let recordingStatus = 'not-recording';
            
            if (recordingMatch) {
                const recordingValue = recordingMatch[1];
                if (recordingValue === 'true') {
                    recordingStatus = 'recording';
                } else if (recordingValue === 'false') {
                    recordingStatus = 'not-recording';
                }
            }
            
            // Check if recording is being processed (this might be in a different part of the XML)
            const processingMatch = xmlText.match(/<processing>(.*?)<\/processing>/);
            if (processingMatch && processingMatch[1] === 'true') {
                recordingStatus = 'processing';
            }
            
            return {
                exists: true,
                meetingID: meetingIdMatch ? meetingIdMatch[1] : '',
                meetingName: meetingNameMatch ? meetingNameMatch[1] : '',
                participantCount: participantCountMatch ? parseInt(participantCountMatch[1]) : 0,
                running: runningMatch ? runningMatch[1] === 'true' : false,
                recordingStatus: recordingStatus,
                rawXML: xmlText
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