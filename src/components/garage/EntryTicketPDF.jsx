import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Svg, Path } from '@react-pdf/renderer';
import { formatInChileanTime } from '@/lib/utils';

// Using standard fonts for broad compatibility
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: '', fontWeight: 'normal' },
    { src: '', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 10,
    width: '80mm', // 226.77 points
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827', // Dark gray, almost black
    backgroundColor: '#FFFFFF',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
  },
  subtitle: {
    fontSize: 8,
    color: '#4B5563', // Medium gray
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light gray
    marginVertical: 8,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    color: '#6B7280', // Lighter gray
  },
  value: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 10,
  },
  licensePlateContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  licensePlateLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  licensePlateValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  footer: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 8,
    color: '#6B7280',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBold: {
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  barcodeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});

// Simple Code 39 barcode generator for PDF
const Barcode = ({ code }) => {
  // Simplified Code 39, only supports uppercase letters and numbers
  const code39 = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101', '$': '100100100101',
    '/': '100100101001', '+': '100101001001', '%': '101001001001', '*': '100101101101'
  };
  
  const fullCode = `*${code}*`;
  let binaryCode = '';
  for (let i = 0; i < fullCode.length; i++) {
    binaryCode += code39[fullCode[i]] + '0'; // Add separator
  }

  let x = 0;
  const paths = [];
  for (let i = 0; i < binaryCode.length; i++) {
    const bar = binaryCode[i];
    const width = bar === '1' ? 2 : 1; // Wide or narrow bar
    if (i % 2 === 0) { // Black bar
      paths.push(<Path key={i} d={`M ${x} 0 L ${x} 40 L ${x + width} 40 L ${x + width} 0 Z`} />);
    }
    x += width;
  }

  return (
    <Svg width={x} height="40" viewBox={`0 0 ${x} 40`}>
      {paths}
    </Svg>
  );
};

const EntryTicketPDF = ({ ticketData }) => {
  if (!ticketData) return null;

  const barcodeValue = ticketData.stayId.replace(/-/g, '');

  return (
    <Document>
      <Page size={{ width: 226.77, height: 'auto' }} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Garaje San José</Text>
          <Text style={styles.subtitle}>Comprobante de Ingreso</Text>
        </View>

        <View style={styles.line} />

        <View style={styles.section}>
          <View style={styles.licensePlateContainer}>
            <Text style={styles.licensePlateLabel}>Matrícula</Text>
            <Text style={styles.licensePlateValue}>{ticketData.license_plate}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Ticket No:</Text>
            <Text style={styles.value}>{ticketData.stayId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha Ingreso:</Text>
            <Text style={styles.value}>{formatInChileanTime(ticketData.entry_at, 'dd/MM/yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hora Ingreso:</Text>
            <Text style={styles.value}>{formatInChileanTime(ticketData.entry_at, 'HH:mm')}</Text>
          </View>
        </View>
        
        <View style={styles.line} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Vehículo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>{ticketData.vehicle_type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>País:</Text>
            <Text style={styles.value}>{ticketData.country}</Text>
          </View>
          {ticketData.driver_name && (
            <View style={styles.row}>
              <Text style={styles.label}>Conductor:</Text>
              <Text style={styles.value}>{ticketData.driver_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.barcodeContainer}>
          <Barcode code={barcodeValue} />
          <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>{barcodeValue}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Conserve este ticket. Es indispensable para el retiro del vehículo.</Text>
          <Text style={styles.footerBold}>¡Gracias por su preferencia!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default EntryTicketPDF;