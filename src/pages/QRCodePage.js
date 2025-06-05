import React from 'react';
import QRCodeGenerator from '../components/QRCode/QRCodeGenerator';
import QRCodeScanner from '../components/QRCode/QRCodeScanner';
import { Grid, Container, Typography } from '@mui/material';

const QRCodePage = () => (
  <Container>
    <Typography variant="h4" align="center" gutterBottom>
      QR Code Tools
    </Typography>
    <Grid container spacing={4} justifyContent="center">
      <Grid item xs={12} md={6}>
        <QRCodeGenerator />
      </Grid>
      <Grid item xs={12} md={6}>
        <QRCodeScanner />
      </Grid>
    </Grid>
  </Container>
);

export default QRCodePage;
