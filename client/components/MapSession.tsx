"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { throttle } from "throttle-debounce";
import { Role } from "../hooks/useSocket";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 40.7128,
    lng: -74.0060,
};

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

interface MapSessionProps {
    roomId: string;
    role: Role;
    isConnected: boolean;
    isWaiting: boolean;
    mapSyncData: any;
    emitMapUpdate: (data: { roomId: string; center: any; zoom: number; tilt: number; timestamp: number }) => void;
}

export default function MapSession({
    roomId,
    role,
    isConnected,
    isWaiting,
    mapSyncData,
    emitMapUpdate,
}: MapSessionProps) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    // HUD variables
    const [currentCenter, setCurrentCenter] = useState(defaultCenter);
    const [currentZoom, setCurrentZoom] = useState(12);

    // New feature: Tracked user auto-sync toggle
    const [isAutoSyncing, setIsAutoSyncing] = useState(true);

    // Track if the map is currently moving due to a sync, to avoid echoing events back
    const isSyncingRef = useRef(false);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback((map: google.maps.Map) => {
        setMap(null);
    }, []);

    // Set up the throttled emitter (14 updates/sec approx 70ms)
    const throttledEmit = useCallback(
        throttle(70, (data: any) => {
            emitMapUpdate(data);
        }),
        [emitMapUpdate]
    );

    const handleIdle = () => {
        if (!map || role !== "tracker" || isSyncingRef.current) return;
        triggerUpdate();
    };

    const handleCenterChanged = () => {
        if (!map) return;

        // If tracked user manually pans/zooms (and map isn't currently moving from a sync)
        if (role === "tracked" && !isSyncingRef.current) {
            setIsAutoSyncing(false);
        }

        if (role === "tracker" && !isSyncingRef.current) {
            const center = map.getCenter();
            if (center) {
                setCurrentCenter({ lat: center.lat(), lng: center.lng() });
                triggerUpdate();
            }
        }
    };

    const handleZoomChanged = () => {
        if (!map) return;

        if (role === "tracked" && !isSyncingRef.current) {
            setIsAutoSyncing(false);
        }

        if (role === "tracker" && !isSyncingRef.current) {
            const zoom = map.getZoom();
            if (zoom !== undefined) {
                setCurrentZoom(zoom);
                triggerUpdate();
            }
        }
    };

    const triggerUpdate = () => {
        if (!map) return;
        const center = map.getCenter();
        const zoom = map.getZoom() || 12;
        const tilt = map.getTilt() || 0;

        if (center) {
            throttledEmit({
                roomId,
                center: { lat: center.lat(), lng: center.lng() },
                zoom,
                tilt,
                timestamp: Date.now(),
            });
        }
    };

    const handleResync = () => {
        if (role === "tracked" && map && mapSyncData) {
            setIsAutoSyncing(true);
            // Immediately pan to latest
            isSyncingRef.current = true;
            if (mapSyncData.center) {
                map.panTo(mapSyncData.center);
                setCurrentCenter(mapSyncData.center);
            }
            if (mapSyncData.zoom !== undefined) {
                map.setZoom(mapSyncData.zoom);
                setCurrentZoom(mapSyncData.zoom);
            }
            if (mapSyncData.tilt !== undefined) map.setTilt(mapSyncData.tilt);

            setTimeout(() => {
                isSyncingRef.current = false;
            }, 50);
        }
    };

    // Sync tracked user map when data arrives
    useEffect(() => {
        // We only apply the sync if isAutoSyncing is true
        if (role === "tracked" && map && mapSyncData && isAutoSyncing) {
            isSyncingRef.current = true;

            if (mapSyncData.center) {
                map.panTo(mapSyncData.center);
                setCurrentCenter(mapSyncData.center);
            }
            if (mapSyncData.zoom !== undefined) {
                map.setZoom(mapSyncData.zoom);
                setCurrentZoom(mapSyncData.zoom);
            }
            if (mapSyncData.tilt !== undefined) map.setTilt(mapSyncData.tilt);

            // Release the lock after pan
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 50);
        }
    }, [mapSyncData, map, role, isAutoSyncing]);

    if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">Loading Map...</div>;

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Offline Banner */}
            {!isConnected && (
                <div className="absolute top-0 left-0 w-full z-50 bg-red-600 border-b border-red-700 text-white text-center py-2 text-sm font-bold shadow-[0_4px_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2">
                    <span className="animate-pulse">⚠️</span> Server Offline: Reconnecting to Socket.io...
                </div>
            )}

            {/* Google Map */}
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onIdle={handleIdle}
                onCenterChanged={handleCenterChanged}
                onZoomChanged={handleZoomChanged}
                options={{
                    gestureHandling: "auto",
                    disableDefaultUI: role === "tracked",
                    zoomControl: role === "tracker",
                    mapTypeControl: false,
                    streetViewControl: false,
                    styles: darkMapStyle,
                }}
            />

            {/* Top-Left: Role Badge */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                <div
                    className={`px-4 py-2 rounded-full font-bold shadow-lg text-sm border flex items-center gap-2 backdrop-blur-md transition-colors 
            ${role === "tracker"
                            ? "bg-red-500/80 border-red-400 text-white"
                            : "bg-blue-500/80 border-blue-400 text-white"}`}
                >
                    <div className={`w-2 h-2 rounded-full ${role === 'tracker' ? 'animate-pulse bg-white' : 'bg-white'}`}></div>
                    {role === "tracker" ? "Broadcasting" : "Syncing"}
                </div>
                {role === "tracker" && isWaiting && (
                    <div className="px-3 py-1.5 rounded-full bg-black/60 text-yellow-300 text-xs border border-yellow-500/30 backdrop-blur-md">
                        Waiting for Tracked user...
                    </div>
                )}
            </div>

            {/* Top-Right: Floating HUD */}
            <div className="absolute top-6 right-6 z-10">
                <div className="bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-5 shadow-2xl min-w-[240px] text-white transition-opacity duration-300">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/50">
                        <h3 className="font-semibold text-gray-200">Session Status</h3>
                        <div className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${!isConnected ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isWaiting && role === 'tracker' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${!isConnected ? 'bg-red-400' : isWaiting && role === 'tracker' ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                            {!isConnected ? 'Disconnected' : isWaiting && role === 'tracker' ? 'Searching' : 'Connected'}
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-400">Lat</span>
                            <span className="font-mono bg-gray-950/50 px-2 py-1 rounded text-cyan-400 group-hover:bg-gray-950 transition-colors">{currentCenter.lat.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-400">Lng</span>
                            <span className="font-mono bg-gray-950/50 px-2 py-1 rounded text-cyan-400 group-hover:bg-gray-950 transition-colors">{currentCenter.lng.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-400">Zoom</span>
                            <span className="font-mono bg-gray-950/50 px-2 py-1 rounded text-purple-400 group-hover:bg-gray-950 transition-colors">{currentZoom}</span>
                        </div>
                        <div className="flex justify-between items-center group pt-2 mt-2 border-t border-gray-700/50">
                            <span className="text-gray-400">Room</span>
                            <span className="font-mono bg-gray-950/50 px-2 py-1 rounded text-gray-300">{roomId}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Re-sync Button */}
            {role === "tracked" && !isAutoSyncing && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20">
                    <button
                        onClick={handleResync}
                        className="group relative px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 overflow-hidden border border-blue-400/50"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="relative z-10 animate-bounce">📍</span>
                        <span className="relative z-10">Re-sync to Tracker</span>
                    </button>
                </div>
            )}
        </div>
    );
}
