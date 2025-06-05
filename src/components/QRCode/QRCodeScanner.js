import React, { useRef, useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, Typography, Button } from '@mui/material';

const QRCodeScanner = () => {
  const [result, setResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const qrCodeRegionId = 'qr-code-region';
  const html5QrCodeRef = useRef(null);

  const startScanner = () => {
    setScanning(true);
    html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);

    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250,
      },
      (decodedText) => {
        setResult(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Ignore scanning errors
      }
    );
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
        setScanning(false);
      }).catch((err) => {
        setScanning(false);
      });
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        });
      }
    };
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          QR Code Scanner
        </Typography>
        {!scanning ? (
          <Button variant="contained" color="primary" onClick={startScanner}>
            Start Scanning
          </Button>
        ) : (
          <Button variant="outlined" color="secondary" onClick={stopScanner}>
            Stop Scanning
          </Button>
        )}
        <div id={qrCodeRegionId} style={{ width: 250, margin: '20px auto' }} />
        <Typography variant="body1" style={{ marginTop: '16px' }}>
          {result ? `Scanned Result: ${result}` : 'No result yet'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
