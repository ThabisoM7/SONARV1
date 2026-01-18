import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get("file") as unknown as File;

        // Check if JSON metadata upload (if no file, but 'metadata' json string)
        // Or strictly file upload.
        // Let's support both or separate? 
        // Pinata API has /pinning/pinFileToIPFS and /pinning/pinJSONToIPFS

        // Simple logic: if 'file' exists, pin file. If 'jsonBody' exists, pin JSON.

        if (file) {
            const formData = new FormData();
            // Explicitly override filename to avoid control characters from user file system
            // Pinata uses this filename in the IPFS directory structure
            formData.append("file", file, `image-${Date.now()}.png`);

            const pinataMetadata = JSON.stringify({
                name: `upload-${Date.now()}`,
            });
            formData.append("pinataMetadata", pinataMetadata);

            const pinataOptions = JSON.stringify({
                cidVersion: 1,
            });
            formData.append("pinataOptions", pinataOptions);

            console.log("Sending to Pinata:", {
                meta: pinataMetadata,
                options: pinataOptions,
                jwtLength: process.env.PINATA_JWT?.length
            });

            const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.PINATA_JWT?.trim()}`,
                },
                body: formData,
            });

            const json = await res.json();

            if (!res.ok) {
                console.error("Pinata Upload Error:", json);
                return NextResponse.json({ error: "Pinata Upload Failed", details: json }, { status: 500 });
            }

            return NextResponse.json(json);
        }

        // Handle JSON Metadata upload
        const jsonBody = data.get("jsonBody");
        if (jsonBody) {
            const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                },
                body: jsonBody as string, // stored as string in formData for simplicity or pass raw JSON body
            });
            const json = await res.json();
            return NextResponse.json(json);
        }

        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
