import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getGatewayUrl(ipfsUri: string | undefined | null) {
    if (!ipfsUri) return '';
    if (ipfsUri.startsWith('http')) return ipfsUri;
    const cid = ipfsUri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
