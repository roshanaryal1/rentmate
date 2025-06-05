import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, TextField, Typography } from '@mui/material';

const QRCodeGenerator = () => {
  const [text, setText] = useState('');

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          QR Code Generator
        </Typography>
        <TextField
          label="Text to encode"
          value={text}
          onChange={e => setText(e.target.value)}
          fullWidth
          margin="normal"
        />
        <div style={{ margin: '20px 0' }}>
          {text && <QRCodeCanvas value={text} size={200} />}
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
