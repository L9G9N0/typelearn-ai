import { exit } from "process";

export function chunkText(text: string): string[]{
    if(!text) return[];
    const cleanedText = text.replace(/\s+/g,' ').trim();
    const rawChunks = cleanedText.split(/(?<=[.?!])\s+/);
    const validChunks = rawChunks.filter((chunk)=> chunk.trim().length>0);
    return validChunks;

}