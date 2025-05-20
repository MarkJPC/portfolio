"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Terminal, { ColorMode, TerminalOutput } from 'react-terminal-ui';
import { fetchAboutMe } from '@/utils/supabaseActions';


export default function About() {
    const [aboutData, setAboutData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchAboutMe().then((data) => {
            if (data) {
                setAboutData(data);
                setLoading(false);
                console.log("Fetched about data:", data);
            } else {
                setError("Failed to fetch about data.");
                setLoading(false);
            }
        });
    }, []);

    return (
        <> {loading ? (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-gray-500">Loading...</p>
            </div>
        ) : error ? (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-red-500">{error}</p>
            </div>
        ) : (
            <div className="max-w-2xl mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4">About Me</h1>
                <p className="text-lg">{aboutData}</p>
            </div>
        )} </>
    )
}

