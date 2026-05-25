import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CalculationResult } from '@/lib/calculator';

// Register Roboto to ensure Polish characters support
Font.register({
    family: 'Arial',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
    ]
});


const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Arial',
        flexDirection: 'column',
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, // Take up remaining space
        marginLeft: 60, // Offset for logo balance
    },
    logoImage: {
        width: 60,
        height: 60,
        objectFit: 'contain',
    },
    tableContainer: {
        borderWidth: 2,
        borderColor: '#999',
        borderStyle: 'solid',
        marginTop: 5,
    },
    tableHeader: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#999',
        padding: 4,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 11,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#999',
        minHeight: 25,
    },
    lastTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0,
        minHeight: 25,
    },
    colLabel: {
        width: '35%',
        borderRightWidth: 1,
        borderRightColor: '#999',
        padding: 5,
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: 10,
        backgroundColor: '#f9f9f9', // Light grey hint often in forms
    },
    colValue: {
        width: '65%',
        padding: 5,
        justifyContent: 'center',
        fontSize: 10,
        flexWrap: 'wrap', // Ensure wrapping
    },
    // Specjalne style dla wierszy wieloliniowych
    multiLineValue: {
        fontSize: 9,
        lineHeight: 1.2,
    },
    footerSection: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 8,
        color: '#000',
        lineHeight: 1.3,
    },
    redPhone: {
        color: 'red',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 5,
        marginBottom: 10,
        textAlign: 'center',
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 30,
        marginBottom: 30,
    },
    signatureLine: {
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#000', // Dotted?
        borderStyle: 'dotted',
        textAlign: 'center',
        paddingTop: 5,
        fontSize: 9,
    },
    bottomLegal: {
        fontSize: 7,
        textAlign: 'justify',
        color: '#444',
        marginTop: 10,
    }
});

interface CertificateProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: { [key: string]: any };
    result: CalculationResult | null;
    issuedNumber?: string;
    signatureUrl?: string;
}

export const CertificateDocument: React.FC<CertificateProps> = ({ formData, result, issuedNumber, signatureUrl }) => {
    if (!result) return <Document><Page><Text>No Data</Text></Page></Document>;

    if (!result) return <Document><Page><Text>No Data</Text></Page></Document>;

    const val = (text: string) => text || "..........................";
    const formatCurrency = (val: number) => {
        return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    let opcjaText = val(formData.opcjaUbez);
    if (result.latT6Z > 0 && result.latT10Z > 0 && formData.opcjaUbez) {
        opcjaText = `${formData.opcjaUbez} (0-7), ${formData.opcjaUbez} (7-10)`;
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <View style={styles.headerText}>
                        <Text>CERTYFIKAT UBEZPIECZENIA</Text>
                        <Text>TRUCK ASSISTANCE DLA KLIENTÓW PEKAO LEASING</Text>
                    </View>
                    <Image
                        style={styles.logoImage}
                        src={typeof window !== 'undefined' ? `${window.location.origin}/axa_logo.png` : '/axa_logo.png'}
                    // eslint-disable-next-line jsx-a11y/alt-text
                    />
                </View>

                {/* Table */}
                <View style={styles.tableContainer}>
                    <Text style={styles.tableHeader}>SZCZEGÓŁY OCHRONY UBEZPIECZENIOWEJ</Text>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Numer certyfikatu:</Text></View>
                        <View style={styles.colValue}><Text>{issuedNumber || (formData.numerUmowy ? 'CER/' + formData.numerUmowy : '................................................')}</Text></View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Ubezpieczający:</Text></View>
                        <View style={styles.colValue}>
                            <Text style={styles.multiLineValue}>
                                Pekao Leasing Sp. z o.o.,{"\n"}
                                Ul. Żubra 1, 01-066 Warszawa,{"\n"}
                                KRS: 00000000867, NIP: 7121016682
                            </Text>
                        </View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Ubezpieczyciel:</Text></View>
                        <View style={styles.colValue}>
                            <Text style={styles.multiLineValue}>
                                Inter Partner Assistance S.A. z siedzibą{"\n"}
                                w Brukseli działająca w Polsce poprzez{"\n"}
                                Inter Partner Assistance S.A. Oddział{"\n"}
                                w Polsce, ul. Giełdowa 1, 01-211{"\n"}
                                Warszawa, KRS 0000320749, NIP{"\n"}
                                1080006955
                            </Text>
                        </View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}>
                            <Text>Dane Partnera – Korzystającego w rozumieniu Umowy Finansowania:</Text>
                        </View>
                        <View style={styles.colValue}>
                            <Text style={{ fontWeight: 'bold' }}>{val(formData.firmaName)}</Text>
                            <Text>{formData.firmaNIP ? `NIP: ${formData.firmaNIP}` : ''}</Text>
                            <Text>{val(formData.firmaUlica)}</Text>
                            <Text>{val(`${formData.firmaKod} ${formData.firmaMiasto}`)}</Text>
                        </View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Wariant i Opcja ubezpieczenia:</Text></View>
                        <View style={styles.colValue}><Text>{opcjaText}</Text></View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Składka ubezpieczeniowa brutto</Text></View>
                        <View style={styles.colValue}><Text>{formatCurrency(result.skladkaCalkowita)} PLN</Text></View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Marka i model pojazdu:</Text></View>
                        <View style={styles.colValue}><Text>{val(`${formData.pojazdMarka} ${formData.pojazdModel}`)}</Text></View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Nr rejestracyjny pojazdu:</Text></View>
                        <View style={styles.colValue}><Text>{val(formData.pojazdRej)}</Text></View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.colLabel}><Text>Nr Umowy Finansowania:</Text></View>
                        <View style={styles.colValue}><Text>{val(formData.numerUmowy)}</Text></View>
                    </View>

                    <View style={styles.lastTableRow}>
                        <View style={styles.colLabel}><Text>Okres ochrony ubezpieczeniowej:</Text></View>
                        <View style={styles.colValue}><Text>{`od ${formData.dataOd}   do ${formData.dataDo}`}</Text></View>
                    </View>
                </View>

                {/* Footer text */}
                <View style={styles.footerSection}>
                    <Text>Niniejszy Certyfikat stanowi potwierdzenie objęcia ochroną ubezpieczeniową Pekao Truck Assistance.</Text>
                    <Text>Pełna informacja o ubezpieczeniu znajduje się w Szczególnych Warunkach Pekao Truck Assistance obowiązujących od dnia 1 czerwca 2026 r.</Text>
                    <Text style={{ marginTop: 5 }}>Telefoniczne Centrum Alarmowe Assistance zakładu ubezpieczeń, czynne 24 godziny na dobę, 7 dni w tygodniu:</Text>
                </View>

                <Text style={styles.redPhone}>22 575 90 11</Text>

                <View style={styles.signatureRow}>
                    <View style={{ alignItems: 'center' }}>
                        {signatureUrl ? (
                            <Image 
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${signatureUrl}`} 
                                style={{ height: 60, marginBottom: 5 }} 
                            />
                        ) : (
                            <Text style={{ marginBottom: 2 }}>........................................</Text>
                        )}
                        <Text style={{ fontSize: 8 }}>Agent</Text>
                    </View>
                </View>

                <Text style={styles.bottomLegal}>
                    Marka AXA Assistance należy do Grupy AXA Assistance, której członkiem jest Inter Partner Assistance S.A. z siedzibą w Brukseli działający w Polsce poprzez Inter Partner Assistance S.A. Oddział w Polsce, ul. Giełdowa 1, 01-211 Warszawa, o numerze NIP 1080006955, zarejestrowany w rejestrze przedsiębiorców prowadzonym przez Sąd Rejonowy dla m. st. Warszawy, XIII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS 0000320749.
                </Text>

            </Page>
        </Document>
    );
};
