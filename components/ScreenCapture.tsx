
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from './common';
import { ScreenShare, ScreenShareOff, Video } from 'lucide-react';
import { useCodeCourtStore } from '../store/useCodeCourtStore';

interface ScreenCaptureProps {
  isAnalyzing: boolean;
  onFrame: (base64Frame: string | null) => void;
}

const ScreenCapture: React.FC<ScreenCaptureProps> = ({ isAnalyzing, onFrame }) => {
  const { isScreenSharing, setIsScreenSharing } = useCodeCourtStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onFrame(dataUrl);
      }
    }
  }, [onFrame]);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsScreenSharing(true);
            // Start capturing frames every 2 seconds after sharing starts
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(captureFrame, 2000);
        };
      }
      stream.getVideoTracks()[0].onended = () => stopCapture();
    } catch (err) {
      console.error("Error: " + err);
      setIsScreenSharing(false);
    }
  }, [setIsScreenSharing, captureFrame]);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if(videoRef.current) videoRef.current.srcObject = null;
    setIsScreenSharing(false);
    onFrame(null);
  }, [setIsScreenSharing, onFrame]);

  useEffect(() => {
      // Cleanup on unmount
      return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          streamRef.current?.getTracks().forEach(track => track.stop());
      }
  }, []);

  return (
    <div className="space-y-4">
        <canvas ref={canvasRef} className="hidden" />
        {isScreenSharing ? (
            <video ref={videoRef} className="w-full rounded-md border aspect-video bg-secondary" autoPlay />
        ) : (
            <div className="w-full flex items-center justify-center aspect-video bg-secondary rounded-md border border-dashed">
                <div className="text-center text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p>Screen share will appear here.</p>
                </div>
            </div>
        )}
        <Button onClick={isScreenSharing ? stopCapture : startCapture} className="w-full" disabled={isAnalyzing}>
            {isScreenSharing ? 
                <><ScreenShareOff className="w-4 h-4 mr-2" /> Stop Sharing</> :
                <><ScreenShare className="w-4 h-4 mr-2" /> Share Screen</>
            }
        </Button>
    </div>
  );
};

export default ScreenCapture;
